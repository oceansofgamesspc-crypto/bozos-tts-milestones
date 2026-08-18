import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config, TARGET, DISCORD_BADGE_EMOJI, assertDiscordConfig } from '../config.js';
import { renderGif } from '../animation/gif.js';
import { createMessage, editMessage, fetchServerCount, verifyChannel } from './publisher.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const statePath = path.join(root, 'data', 'state.json');

async function readState() {
  try { return JSON.parse(await fs.readFile(statePath, 'utf8')); }
  catch { return { lastCount: null, messageId: config.messageId || '', celebrated: false }; }
}

async function writeState(state) {
  await fs.mkdir(path.dirname(statePath), { recursive: true });
  await fs.writeFile(statePath, JSON.stringify(state, null, 2));
}

async function buildAnimation(count) {
  const output = path.join(root, 'output', count >= TARGET ? 'milestone-100.webp' : 'milestone-live.webp');
  await fs.mkdir(path.dirname(output), { recursive: true });
  await renderGif({ servers: Math.min(count, TARGET), celebration: count >= TARGET, output });
  return fs.readFile(output);
}

async function publishCount(count, messageId) {
  const buffer = await buildAnimation(count);
  const filename = count >= TARGET ? 'bozos-100.webp' : 'bozos-road-to-100.webp';
  const content = count >= TARGET
    ? `${DISCORD_BADGE_EMOJI} **BOZOS TTS HAS REACHED 100 SERVERS!**`
    : `${DISCORD_BADGE_EMOJI} **BOZOS TTS — ROAD TO 100** • ${count}/100 servers`;

  if (messageId) {
    await editMessage({ token: config.token, channelId: config.channelId, messageId, buffer, filename, content });
    return messageId;
  }

  const message = await createMessage({ token: config.token, channelId: config.channelId, buffer, filename, content });
  console.log(`Created milestone message: ${message.id}`);
  console.log('Set MILESTONE_MESSAGE_ID to this value in Railway after confirming the channel.');
  return message.id;
}

async function tick(state) {
  const count = config.testMode && Number.isInteger(config.testServers)
    ? config.testServers
    : await fetchServerCount(config.token);

  // A prior 100 celebration is permanent. Before 100, always keep the live board current.
  if (state.celebrated) return state;
  if (state.lastCount === count && state.messageId) return state;

  console.log(`Bozos TTS server count: ${count}`);
  state.messageId = await publishCount(Math.min(count, TARGET), state.messageId);
  state.lastCount = count;
  state.celebrated = count >= TARGET;
  await writeState(state);
  return state;
}

assertDiscordConfig();
await verifyChannel({ token: config.token, guildId: config.guildId, channelId: config.channelId });
let state = await readState();

console.log('Bozos TTS 100-server milestone service online.');
await tick(state);

setInterval(async () => {
  try { state = await tick(state); }
  catch (error) { console.error('[milestone]', error); }
}, config.refreshMs);
