package main

import (
	"bufio"
	"crypto/sha1"
	"embed"
	"encoding/base64"
	"encoding/binary"
	"flag"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os/exec"
	"runtime"
	"strings"
	"sync"
	"time"
)

//go:embed web/*
var assets embed.FS

type wsClient struct {
	conn net.Conn
	role string
	mu   sync.Mutex
}

func (c *wsClient) sendText(s string) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	payload := []byte(s)
	header := []byte{0x81}
	switch {
	case len(payload) < 126:
		header = append(header, byte(len(payload)))
	case len(payload) <= 65535:
		header = append(header, 126, byte(len(payload)>>8), byte(len(payload)))
	default:
		header = append(header, 127)
		var b [8]byte
		binary.BigEndian.PutUint64(b[:], uint64(len(payload)))
		header = append(header, b[:]...)
	}
	if _, err := c.conn.Write(header); err != nil {
		return err
	}
	_, err := c.conn.Write(payload)
	return err
}

func (c *wsClient) sendControl(op byte, payload []byte) error {
	c.mu.Lock()
	defer c.mu.Unlock()
	if len(payload) > 125 {
		payload = payload[:125]
	}
	_, err := c.conn.Write(append([]byte{0x80 | op, byte(len(payload))}, payload...))
	return err
}

type hub struct {
	mu    sync.Mutex
	host  *wsClient
	guest *wsClient
}

func (h *hub) set(role string, c *wsClient) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if role == "host" {
		if h.host != nil {
			_ = h.host.conn.Close()
		}
		h.host = c
	} else {
		if h.guest != nil {
			_ = h.guest.conn.Close()
		}
		h.guest = c
	}
	h.notifyLocked()
}

func (h *hub) remove(c *wsClient) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.host == c {
		h.host = nil
	}
	if h.guest == c {
		h.guest = nil
	}
	h.notifyLocked()
}

func (h *hub) notifyLocked() {
	both := h.host != nil && h.guest != nil
	msg := fmt.Sprintf(`{"type":"peer","connected":%v}`, both)
	if h.host != nil {
		_ = h.host.sendText(msg)
	}
	if h.guest != nil {
		_ = h.guest.sendText(msg)
	}
}

func (h *hub) relay(from *wsClient, text string) {
	h.mu.Lock()
	var to *wsClient
	if from == h.host {
		to = h.guest
	} else if from == h.guest {
		to = h.host
	}
	h.mu.Unlock()
	if to != nil {
		_ = to.sendText(text)
	}
}

var gameHub hub

func websocketAccept(key string) string {
	h := sha1.Sum([]byte(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"))
	return base64.StdEncoding.EncodeToString(h[:])
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
	if !strings.EqualFold(r.Header.Get("Upgrade"), "websocket") || !strings.Contains(strings.ToLower(r.Header.Get("Connection")), "upgrade") {
		http.Error(w, "websocket upgrade required", http.StatusBadRequest)
		return
	}
	key := r.Header.Get("Sec-WebSocket-Key")
	if key == "" {
		http.Error(w, "missing websocket key", http.StatusBadRequest)
		return
	}
	role := r.URL.Query().Get("role")
	if role != "host" && role != "guest" {
		http.Error(w, "role must be host or guest", http.StatusBadRequest)
		return
	}

	hj, ok := w.(http.Hijacker)
	if !ok {
		http.Error(w, "hijacking unsupported", http.StatusInternalServerError)
		return
	}
	conn, rw, err := hj.Hijack()
	if err != nil {
		return
	}
	_, _ = fmt.Fprintf(rw, "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: %s\r\n\r\n", websocketAccept(key))
	_ = rw.Flush()

	c := &wsClient{conn: conn, role: role}
	gameHub.set(role, c)
	defer func() { gameHub.remove(c); _ = conn.Close() }()

	br := rw.Reader
	for {
		op, payload, err := readFrame(br)
		if err != nil {
			return
		}
		switch op {
		case 0x1:
			gameHub.relay(c, string(payload))
		case 0x8:
			_ = c.sendControl(0x8, payload)
			return
		case 0x9:
			_ = c.sendControl(0xA, payload)
		case 0xA:
			// pong
		}
	}
}

func readFrame(r *bufio.Reader) (byte, []byte, error) {
	b1, err := r.ReadByte()
	if err != nil {
		return 0, nil, err
	}
	b2, err := r.ReadByte()
	if err != nil {
		return 0, nil, err
	}
	op := b1 & 0x0f
	masked := b2&0x80 != 0
	ln := uint64(b2 & 0x7f)
	if ln == 126 {
		var b [2]byte
		if _, err = io.ReadFull(r, b[:]); err != nil {
			return 0, nil, err
		}
		ln = uint64(binary.BigEndian.Uint16(b[:]))
	} else if ln == 127 {
		var b [8]byte
		if _, err = io.ReadFull(r, b[:]); err != nil {
			return 0, nil, err
		}
		ln = binary.BigEndian.Uint64(b[:])
	}
	if ln > 16<<20 {
		return 0, nil, fmt.Errorf("frame too large")
	}
	var mask [4]byte
	if masked {
		if _, err = io.ReadFull(r, mask[:]); err != nil {
			return 0, nil, err
		}
	}
	payload := make([]byte, int(ln))
	if _, err = io.ReadFull(r, payload); err != nil {
		return 0, nil, err
	}
	if masked {
		for i := range payload {
			payload[i] ^= mask[i%4]
		}
	}
	return op, payload, nil
}

func openBrowser(url string) {
	time.Sleep(450 * time.Millisecond)
	switch runtime.GOOS {
	case "windows":
		_ = exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
	case "darwin":
		_ = exec.Command("open", url).Start()
	default:
		_ = exec.Command("xdg-open", url).Start()
	}
}

func main() {
	port := flag.String("port", "8787", "listen port")
	noBrowser := flag.Bool("no-browser", false, "do not open browser automatically")
	flag.Parse()

	webFS, err := fs.Sub(assets, "web")
	if err != nil {
		log.Fatal(err)
	}
	static := http.FileServer(http.FS(webFS))

	http.HandleFunc("/ws", wsHandler)
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		if r.URL.Path == "/game.html" {
			clone := r.Clone(r.Context())
			clone.URL.Path = "/"
			static.ServeHTTP(w, clone)
			return
		}
		static.ServeHTTP(w, r)
	})

	addr := ":" + *port
	url := "http://127.0.0.1:" + *port + "/"
	log.Printf("Neon Duel server: %s", url)
	log.Printf("Port forwarding for internet HOST: TCP %s -> this PC:%s", *port, *port)
	if !*noBrowser {
		go openBrowser(url)
	}
	if err := http.ListenAndServe(addr, nil); err != nil {
		log.Fatal(err)
	}
}
