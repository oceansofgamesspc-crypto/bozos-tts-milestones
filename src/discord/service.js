import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client, Events, GatewayIntentBits } from 'discord.js';
import { config, TARGET, DISCORD_BADGE_EMOJI, assertDiscordConfig } from '../config.js';
import { renderGif } from '../animation/gif.js';
import { createMessage, editMessage, verifyChannel } from './publisher.js';

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
    console.log(`[publish] Updated milestone message ${messageId} -> ${count}/100.`);
    return messageId;
  }

  const message = await createMessage({ token: config.token, channelId: config.channelId, buffer, filename, content });
  console.log(`Created milestone message: ${message.id}`);
  console.log('Set MILESTONE_MESSAGE_ID to this value in Railway after confirming the channel.');
  return message.id;
}

function currentGuildCount(client) {
  return client.guilds.cache.size;
}

async function tick(state, client, reason = 'heartbeat') {
  const checkedAt = new Date().toISOString();
  const count = config.testMode && Number.isInteger(config.testServers)
    ? config.testServers
    : currentGuildCount(client);

  console.log(`[poll:${reason}] ${checkedAt} | Discord gateway guild count = ${count} | previous = ${state.lastCount ?? 'none'}`);

  // A prior 100 celebration is permanent. Before 100, always keep the live board current.
  if (state.celebrated) return state;
  if (state.lastCount === count && state.messageId) return state;

  console.log(`Bozos TTS server count changed: ${state.lastCount ?? 'none'} -> ${count}`);
  state.messageId = await publishCount(Math.min(count, TARGET), state.messageId);
  state.lastCount = count;
  state.celebrated = count >= TARGET;
  await writeState(state);
  return state;
}

assertDiscordConfig();
await verifyChannel({ token: config.token, guildId: config.guildId, channelId: config.channelId });
let state = await readState();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let updateChain = Promise.resolve();

function queueUpdate(reason) {
  updateChain = updateChain
    .then(async () => {
      state = await tick(state, client, reason);
    })
    .catch((error) => {
      console.error(`[milestone] Update failed (${reason}):`, error);
    });
  return updateChain;
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Discord gateway ready as ${readyClient.user.tag}.`);
  console.log(`Discord gateway currently reports ${readyClient.guilds.cache.size} servers.`);
  await queueUpdate('ready');
});

// These are the important events: unlike polling an HTTP endpoint, Discord tells
// us immediately when the bot joins or leaves a guild. This keeps the milestone
// board synchronized with the actual bot membership count.
client.on(Events.GuildCreate, (guild) => {
  console.log(`[gateway] Joined server: ${guild.name} (${guild.id}). Cache now has ${client.guilds.cache.size} servers.`);
  queueUpdate('guildCreate');
});

client.on(Events.GuildDelete, (guild) => {
  console.log(`[gateway] Left server: ${guild.name} (${guild.id}). Cache now has ${client.guilds.cache.size} servers.`);
  queueUpdate('guildDelete');
});

client.on(Events.Error, (error) => {
  console.error('[discord] Gateway error:', error);
});

client.on(Events.ShardError, (error) => {
  console.error('[discord] Shard error:', error);
});

console.log('Bozos TTS 100-server milestone service online.');

if (config.testMode && Number.isInteger(config.testServers)) {
  await client.login(config.token);
  await queueUpdate('test');
} else {
  await client.login(config.token);
}

// Heartbeat/reconciliation. Gateway events are the primary mechanism; this is a
// safety net in case an event is missed during a reconnect or process hiccup.
setInterval(() => {
  queueUpdate('heartbeat');
}, config.refreshMs);
