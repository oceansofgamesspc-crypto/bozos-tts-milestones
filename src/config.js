import 'dotenv/config';

// Keep the authored 1280x720 canvas. Discord animated WebP gives us much
// better quality than GIF for the neon gradients and glows.
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

export const config = {
  token: process.env.DISCORD_TOKEN || '',
  guildId: process.env.MILESTONE_GUILD_ID || '',
  channelId: process.env.MILESTONE_CHANNEL_ID || '',
  messageId: process.env.MILESTONE_MESSAGE_ID || '',
  // One-minute polling keeps the milestone live without hammering Discord.
  refreshMs: Math.max(15000, Number(process.env.REFRESH_INTERVAL_MS || 60000)),
  testServers: process.env.TEST_SERVERS ? Number(process.env.TEST_SERVERS) : null,
  testMode: process.env.TEST_MODE === 'true'
};

export function assertDiscordConfig() {
  const missing = ['DISCORD_TOKEN', 'MILESTONE_GUILD_ID', 'MILESTONE_CHANNEL_ID']
    .filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing Railway environment variables: ${missing.join(', ')}`);
}
