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
  try {
    const state = JSON.parse(await fs.readFile(statePath, 'utf8'));
    return {
      lastCount: state.lastCount ?? null,
      messageIds: state.messageIds || {},
      celebrated: Boolean(state.celebrated)
    };
  } catch {
    return { lastCount: null, messageIds: {}, celebrated: false };
  }
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

async function publishDestination(destination, count, buffer, currentMessageId) {
  const filename = count >= TARGET ? 'bozos-100.webp' : 'bozos-road-to-100.webp';
  const content = count >= TARGET
    ? `${DISCORD_BADGE_EMOJI} **BOZOS TTS HAS REACHED 100 SERVERS!**`
    : `${DISCORD_BADGE_EMOJI} **BOZOS TTS — ROAD TO 100** • ${count}/100 servers`;

  const messageId = destination.messageId || currentMessageId || '';

  if (messageId) {
    try {
      await editMessage({ token: config.token, channelId: destination.channelId, messageId, buffer, filename, content });
      console.log(`[publish:${destination.key}] Updated milestone message ${messageId} -> ${count}/100.`);
      return messageId;
    } catch (error) {
      console.warn(`[publish:${destination.key}] Could not edit ${messageId}; creating a fresh milestone message.`, error.message);
    }
  }

  const message = await createMessage({ token: config.token, channelId: destination.channelId, buffer, filename, content });
  console.log(`[publish:${destination.key}] Created milestone message: ${message.id}`);
  console.log(`[publish:${destination.key}] Set MILESTONE_MESSAGE_ID${destination.key === '1' ? '' : `_${destination.key}`}=${message.id} in Railway.`);
  return message.id;
}

async function publishCount(count, state) {
  // Render once, then reuse the exact same animation in every configured server.
  const buffer = await buildAnimation(count);
  const nextIds = { ...state.messageIds };

  for (const destination of config.destinations) {
    nextIds[destination.key] = await publishDestination(
      destination,
      count,
      buffer,
      state.messageIds[destination.key]
    );
  }

  return nextIds;
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

  if (state.celebrated) return state;

  const allMessagesKnown = config.destinations.every((destination) =>
    Boolean(destination.messageId || state.messageIds[destination.key])
  );
  if (state.lastCount === count && allMessagesKnown) return state;

  console.log(`Bozos TTS server count changed: ${state.lastCount ?? 'none'} -> ${count}`);
  state.messageIds = await publishCount(Math.min(count, TARGET), state);
  state.lastCount = count;
  state.celebrated = count >= TARGET;
  await writeState(state);
  return state;
}

assertDiscordConfig();
for (const destination of config.destinations) {
  await verifyChannel({ token: config.token, guildId: destination.guildId, channelId: destination.channelId });
  console.log(`[destination:${destination.key}] Verified guild ${destination.guildId}, channel ${destination.channelId}.`);
}

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

client.on(Events.GuildCreate, (guild) => {
  console.log(`[gateway] Joined server: ${guild.name} (${guild.id}). Cache now has ${client.guilds.cache.size} servers.`);
  queueUpdate('guildCreate');
});

client.on(Events.GuildDelete, (guild) => {
  console.log(`[gateway] Left server: ${guild.name} (${guild.id}). Cache now has ${client.guilds.cache.size} servers.`);
  queueUpdate('guildDelete');
});

client.on(Events.Error, (error) => console.error('[discord] Gateway error:', error));
client.on(Events.ShardError, (error) => console.error('[discord] Shard error:', error));

console.log(`Bozos TTS 100-server milestone service online with ${config.destinations.length} destination(s).`);
await client.login(config.token);

if (config.testMode && Number.isInteger(config.testServers)) {
  await queueUpdate('test');
}

setInterval(() => queueUpdate('heartbeat'), config.refreshMs);
