# NeonDuel

NeonDuel is a neon arena shooter with solo, co-op, and VS modes.

## Current build

This repository starts from the latest working multiplayer balance build from 2026-08-14.

### Highlights

- Solo / HOST CO-OP / HOST VS / JOIN
- Go executable serving the embedded HTML game
- WebSocket multiplayer on TCP 8787
- Upgrade/shop progression and local profile saves
- Normal stages, midbosses, big bosses, and the Stage 20 Boss 2 aura gimmick
- Multiplayer-specific enemy scaling and sticky multi-target AI
- Multiplayer midboss stages spawn two midbosses, each at 1.25x solo midboss HP
- Multiplayer big-boss direct projectile damage is 1.25x

## Source layout

- `main.go` - local HTTP/WebSocket server and launcher
- `web/game.part00` ... `web/game.part06` - the game HTML split into ordered source chunks

The Go server embeds all `web/game.part*` files and concatenates them in filename order at runtime. The split is only a repository transport/detail; together they are the current game HTML.

## Run from source

```bash
go run main.go
```

Then open the local address printed by the program. For internet multiplayer, the host needs TCP port 8787 forwarded to the machine running the game.

## Build Windows x64

```bash
GOOS=windows GOARCH=amd64 go build -o neon_duel.exe main.go
```

No external Go module dependency is required.
