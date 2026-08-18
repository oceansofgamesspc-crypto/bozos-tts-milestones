import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config, TARGET, assertDiscordConfig } from '../config.js';
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
  // Runtime state is intentionally not committed to Git.
  await fs.writeFile(statePath, JSON.stringify(state, null, 2));
}

async function buildGif(count) {
  const output = path.join(root, 'output', count >= TARGET ? 'milestone-100.gif' : 'milestone-live.gif');
  await fs.mkdir(path.dirname(output), { recursive: true });
  await renderGif({ servers: Math.min(count, TARGET), celebration: count >= TARGET, output });
  return fs.readFile(output);
}

async function publishCount(count, messageId) {
  const buffer = await buildGif(count);
  const filename = count >= TARGET ? 'bozos-100.gif' : 'bozos-road-to-100.gif';
  const content = count >= TARGET
    ? '🏆 **BOZOS TTS HAS REACHED 100 SERVERS!** 💜'
    : `🤖 **BOZOS TTS — ROAD TO 100** • ${count}/100 servers`;

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

  if (count >= TARGET && state.celebrated && state.messageId) return state;
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
