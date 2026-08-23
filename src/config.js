import 'dotenv/config';

export const DESIGN_WIDTH = 1280;
export const DESIGN_HEIGHT = 720;
export const WIDTH = 1280;
export const HEIGHT = 720;
export const OUTPUT_WIDTH = WIDTH;
export const OUTPUT_HEIGHT = HEIGHT;
export const FPS = 8;
export const TARGET = 100;
export const MAX_UPLOAD_BYTES = 9_000_000;

export const COLORS = {
  background: '#03050b',
  panel: '#070a13',
  panel2: '#0b0e1a',
  purple: '#a855f7',
  purpleBright: '#e879f9',
  violet: '#7c3aed',
  cyan: '#22d3ee',
  blue: '#60a5fa',
  white: '#f8f7ff',
  muted: '#9ca3c8',
  dim: '#51577b',
  line: '#252052'
};

export const DISCORD_BADGE_EMOJI = '<a:badge:1525875105605882047>';

const destinations = [
  {
    key: '1',
    guildId: process.env.MILESTONE_GUILD_ID || '',
    channelId: process.env.MILESTONE_CHANNEL_ID || '',
    messageId: process.env.MILESTONE_MESSAGE_ID || ''
  },
  {
    key: '2',
    guildId: process.env.MILESTONE_GUILD_ID_2 || '',
    channelId: process.env.MILESTONE_CHANNEL_ID_2 || '',
    messageId: process.env.MILESTONE_MESSAGE_ID_2 || ''
  }
].filter((destination) => destination.guildId || destination.channelId || destination.messageId);

export const config = {
  token: process.env.DISCORD_TOKEN || '',
  destinations,
  refreshMs: Math.max(15000, Number(process.env.REFRESH_INTERVAL_MS || 60000)),
  testServers: process.env.TEST_SERVERS ? Number(process.env.TEST_SERVERS) : null,
  testMode: process.env.TEST_MODE === 'true'
};

export function assertDiscordConfig() {
  const missing = [];
  if (!process.env.DISCORD_TOKEN) missing.push('DISCORD_TOKEN');
  if (!process.env.MILESTONE_GUILD_ID) missing.push('MILESTONE_GUILD_ID');
  if (!process.env.MILESTONE_CHANNEL_ID) missing.push('MILESTONE_CHANNEL_ID');

  for (const destination of destinations) {
    if (!destination.guildId || !destination.channelId) {
      throw new Error(`Milestone destination ${destination.key} is incomplete. Both guild ID and channel ID are required.`);
    }
  }

  if (missing.length) {
    throw new Error(`Missing Railway environment variables: ${missing.join(', ')}`);
  }
}
