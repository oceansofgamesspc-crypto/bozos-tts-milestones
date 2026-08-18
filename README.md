# Bozos TTS — 100 Server Milestone

A standalone visual milestone engine for the **Bozos TTS 100-server moment**.

> This project is intentionally scoped to **100 servers only**. No generic milestone framework yet.

## Creative direction

The visual language follows the provided Bozos TTS reference:

- dark futuristic HUD
- electric purple + cyan neon
- circular audio/reactor ring
- premium typography
- subtle ambient particles and scan effects
- animated 99-server critical state
- cinematic 99 → 100 celebration
- restrained, polished motion rather than noisy Discord GIF effects

## Runtime states

1. **ROAD TO 100** — live animated tracker below 99.
2. **ONE SERVER AWAY** — special 99-server animation.
3. **MILESTONE UNLOCKED** — one-shot 100-server celebration.
4. **100 SERVERS** — calm post-celebration loop.

## Project layout

```text
src/
  animation/       timing and frame generation
  discord/         Discord publisher integration
  render/          visual renderer
  config.js        environment/config loading
  index.js         CLI entry point
assets/
  fonts/           optional local fonts
  logo/            Bozos logo goes here
output/             generated previews (gitignored)
```

## Development

```bash
npm install
npm run preview:99
npm run preview:100
```

Generated previews are written to `output/`.

## Environment

Copy `.env.example` to `.env` when wiring Discord publishing.

**Never commit a bot token.**

## Discord architecture

This repository is deliberately separate from the production Bozos TTS codebase. The milestone renderer is independent; Discord publishing can consume a server-count source later without duplicating the production bot's Gateway session.
