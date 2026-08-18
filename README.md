# Bozos TTS — 100 Server Milestone

A standalone visual milestone engine for the **Bozos TTS 100-server moment**.

> **Scope:** 100 servers only. This is the special event project, not a generic milestone framework.

## Creative direction

The supplied Bozos TTS artwork is the design bible:

- dark futuristic HUD
- electric purple + cyan neon
- circular audio/reactor ring
- premium, high-contrast typography
- subtle ambient particles, scan sweeps and electrical arcs
- a tense 99-server critical state
- cinematic 99 → 100 transition
- a polished 100-server celebration

## Runtime states

1. **ROAD TO 100** — live animated tracker.
2. **ONE SERVER AWAY** — special 99-server state.
3. **MILESTONE UNLOCKED** — 99 → 100 celebration.
4. **100 SERVERS** — calm achieved-state loop.

## Project layout

```text
src/
  animation/gif.js      GIF frame pipeline
  discord/publisher.js  Discord REST publisher
  discord/service.js    Railway runtime
  render/renderer.js    layered visual renderer
  config.js             environment + animation constants
  index.js              local preview CLI
assets/
  logo/bozos-tts.png    supplied Bozos logo (add this binary asset)
output/                  generated previews (gitignored)
data/state.json         runtime message/count state (gitignored)
railway.toml             Railway start configuration
```

## Local preview

```bash
npm install
npm run preview:99
npm run preview:100
```

Generated GIFs are written to `output/`.

### Logo asset

Add the supplied 320×320 transparent PNG as:

```text
assets/logo/bozos-tts.png
```

The renderer has a text fallback if the file is absent.

## Railway

Create a Railway service from this repository and set:

```text
DISCORD_TOKEN=your_bot_token
MILESTONE_GUILD_ID=your_friend_server_id
MILESTONE_CHANNEL_ID=your_milestone_channel_id
MILESTONE_MESSAGE_ID=
REFRESH_INTERVAL_MS=300000
```

The **server ID is intentionally an environment variable**. You can change it in Railway without changing the repository.

On first run the service creates one permanent milestone message in the configured channel and logs its message ID. Put that ID into `MILESTONE_MESSAGE_ID` afterward. Future count changes edit the same message rather than spamming the channel.

For local testing:

```text
TEST_MODE=true
TEST_SERVERS=99
```

or:

```text
TEST_MODE=true
TEST_SERVERS=100
```

## Discord permissions

The bot needs only the configured channel's relevant permissions:

- View Channel
- Send Messages
- Embed Links
- Attach Files
- Read Message History

No Administrator permission is required.

## Safety

Never commit `.env`, `DISCORD_TOKEN`, or any other credential. Runtime state is ignored by Git.
