import { createCanvas, loadImage, registerFont } from 'canvas';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WIDTH, HEIGHT, COLORS, TARGET } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO = path.resolve(__dirname, '../../assets/logo/bozos-tts.png');
const FONT_DIR = path.resolve(__dirname, '../../node_modules/roboto-fontface/fonts/roboto');
const TAU = Math.PI * 2;

try {
  registerFont(path.join(FONT_DIR, 'Roboto-Regular.ttf'), { family: 'BozosRoboto', weight: '400' });
  registerFont(path.join(FONT_DIR, 'Roboto-Medium.ttf'), { family: 'BozosRoboto', weight: '500' });
  registerFont(path.join(FONT_DIR, 'Roboto-Bold.ttf'), { family: 'BozosRoboto', weight: '700' });
  registerFont(path.join(FONT_DIR, 'Roboto-Black.ttf'), { family: 'BozosRoboto', weight: '900' });
} catch (error) {
  console.warn('[renderer] bundled Roboto registration failed:', error.message);
}

function rgba(hex, alpha = 1) {
  const n = hex.replace('#', '');
  return `rgba(${parseInt(n.slice(0, 2), 16)},${parseInt(n.slice(2, 4), 16)},${parseInt(n.slice(4, 6), 16)},${alpha})`;
}

function glow(ctx, color, blur) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}

function text(ctx, value, x, y, size, color, align = 'center', weight = '700') {
  ctx.save();
  ctx.font = `${weight} ${size}px BozosRoboto`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
  ctx.restore();
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function panel(ctx, x, y, w, h, stroke = COLORS.line) {
  ctx.save();
  ctx.fillStyle = rgba(COLORS.panel, 0.88);
  ctx.strokeStyle = rgba(stroke, 0.42);
  ctx.lineWidth = 2;
  roundedRect(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawBackground(ctx, t) {
  const g = ctx.createRadialGradient(580, 350, 30, 580, 350, 900);
  g.addColorStop(0, '#15132f');
  g.addColorStop(0.42, '#080b17');
  g.addColorStop(1, '#020308');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.strokeStyle = COLORS.cyan;
  ctx.lineWidth = 1;
  const drift = (t * 0.018) % 80;
  for (let x = -80 + drift; x < WIDTH + 100; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - 180, HEIGHT); ctx.stroke();
  }
  for (let y = 0; y < HEIGHT; y += 48) {
    const yy = y + ((t * 0.012) % 48);
    ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(WIDTH, yy); ctx.stroke();
  }
  ctx.restore();

  for (let i = 0; i < 90; i++) {
    const seed = i * 17.31;
    const x = (seed * 83.7) % WIDTH;
    const y = (seed * 47.9) % HEIGHT;
    const phase = t * 0.00045 + i * 0.71;
    ctx.fillStyle = i % 3
      ? rgba(COLORS.purple, 0.12 + 0.16 * (0.5 + 0.5 * Math.sin(phase)))
      : rgba(COLORS.cyan, 0.20);
    ctx.fillRect(x + Math.sin(phase) * 13, y + Math.cos(phase * 0.73) * 8, 2, 2);
  }

  const scanY = (t * 0.03) % HEIGHT;
  const scan = ctx.createLinearGradient(0, scanY - 45, 0, scanY + 45);
  scan.addColorStop(0, 'rgba(168,85,247,0)');
  scan.addColorStop(0.5, 'rgba(168,85,247,0.08)');
  scan.addColorStop(1, 'rgba(34,211,238,0)');
  ctx.fillStyle = scan;
  ctx.fillRect(0, scanY - 45, WIDTH, 90);
}

function drawFrame(ctx, t) {
  ctx.save();
  ctx.strokeStyle = rgba(COLORS.line, 0.95);
  ctx.lineWidth = 2;
  roundedRect(ctx, 20, 58, 1240, 642, 20); ctx.stroke();
  ctx.strokeStyle = rgba(COLORS.purple, 0.34);
  roundedRect(ctx, 35, 74, 1210, 610, 16); ctx.stroke();

  const sweep = (t * 0.12) % 1500 - 150;
  const g = ctx.createLinearGradient(sweep - 160, 0, sweep + 160, 0);
  g.addColorStop(0, rgba(COLORS.purple, 0));
  g.addColorStop(0.5, rgba(COLORS.cyan, 0.26));
  g.addColorStop(1, rgba(COLORS.purple, 0));
  ctx.strokeStyle = g;
  ctx.lineWidth = 3;
  roundedRect(ctx, 35, 74, 1210, 610, 16); ctx.stroke();
  ctx.restore();
}

async function drawLogo(ctx) {
  try {
    const logo = await loadImage(await fs.readFile(LOGO));
    ctx.save();
    ctx.globalAlpha = 0.99;
    ctx.shadowColor = COLORS.purple;
    ctx.shadowBlur = 28;
    ctx.drawImage(logo, 65, 165, 300, 300);
    ctx.restore();
  } catch {
    text(ctx, 'BOZOS', 215, 295, 58, COLORS.purpleBright, 'center', '900');
    text(ctx, 'TTS', 215, 350, 38, COLORS.cyan, 'center', '900');
  }
}

function drawHeader(ctx, celebration) {
  ctx.save();
  glow(ctx, COLORS.purple, 20);
  text(ctx, celebration ? 'BOZOS TTS - 100 SERVERS' : 'BOZOS TTS - ROAD TO 100', 640, 35, 34, COLORS.white, 'center', '900');
  ctx.shadowBlur = 0;
  text(ctx, celebration ? 'MILESTONE UNLOCKED' : 'LIVE ANIMATED MILESTONE', 640, 78, 17, COLORS.cyan, 'center', '700');
  ctx.restore();
}

function drawReactor(ctx, servers, t, celebration) {
  const cx = 585;
  const cy = 365;
  const base = 145;
  const progress = Math.min(servers / TARGET, 1);
  const angle = t * (celebration ? 0.012 : 0.0045);

  ctx.save();
  ctx.translate(cx, cy);
  const pulse = 1 + Math.sin(t * 0.004) * 0.018;
  ctx.scale(pulse, pulse);

  const aura = ctx.createRadialGradient(0, 0, 30, 0, 0, 245);
  aura.addColorStop(0, rgba(COLORS.purple, celebration ? 0.34 : 0.18));
  aura.addColorStop(0.46, rgba(COLORS.cyan, 0.08));
  aura.addColorStop(1, rgba(COLORS.purple, 0));
  ctx.fillStyle = aura;
  ctx.beginPath(); ctx.arc(0, 0, 245, 0, TAU); ctx.fill();

  for (let ring = 0; ring < 3; ring++) {
    ctx.save();
    ctx.rotate(angle * (ring % 2 ? -0.6 : 1));
    ctx.lineWidth = ring === 0 ? 10 : 3;
    ctx.strokeStyle = ring === 0 ? rgba(COLORS.purpleBright, 0.92) : rgba(COLORS.cyan, 0.34);
    glow(ctx, ring === 0 ? COLORS.purple : COLORS.cyan, ring === 0 ? 24 : 8);
    ctx.beginPath();
    ctx.arc(0, 0, base + ring * 19, ring * 0.55, TAU - ring * 0.42);
    ctx.stroke();
    ctx.restore();
  }

  const segments = 72;
  const active = Math.round(progress * segments);
  for (let i = 0; i < segments; i++) {
    const a = -Math.PI / 2 + i * TAU / segments;
    const on = i < active;
    ctx.save();
    ctx.rotate(a);
    ctx.fillStyle = on
      ? (i % 4 === 0 ? rgba(COLORS.cyan, 0.98) : rgba(COLORS.purpleBright, 0.96))
      : rgba('#34395f', 0.40);
    ctx.shadowColor = on ? COLORS.purple : 'transparent';
    ctx.shadowBlur = on ? 10 + 8 * (0.5 + 0.5 * Math.sin(t * 0.009 - i)) : 0;
    ctx.fillRect(base - 4, -3, 18, 6);
    ctx.restore();
  }

  ctx.save();
  ctx.rotate(-angle * 0.55);
  for (let i = 0; i < 36; i++) {
    const a = i * TAU / 36;
    ctx.save();
    ctx.rotate(a);
    ctx.fillStyle = rgba(i % 3 ? COLORS.purple : COLORS.cyan, 0.42);
    ctx.fillRect(104, -1, i % 3 ? 8 : 13, 2);
    ctx.restore();
  }
  ctx.restore();

  const arcs = celebration ? 14 : 5;
  for (let i = 0; i < arcs; i++) {
    const p = (t * 0.0012 + i * 0.23) % 1;
    const a1 = -Math.PI / 2 + p * TAU;
    ctx.strokeStyle = i % 2 ? rgba(COLORS.cyan, 0.75) : rgba(COLORS.purpleBright, 0.75);
    ctx.lineWidth = 2;
    glow(ctx, i % 2 ? COLORS.cyan : COLORS.purple, 12);
    ctx.beginPath();
    ctx.arc(0, 0, base + 9, a1, a1 + 0.12 + 0.06 * Math.sin(i * 9.1));
    ctx.stroke();
  }

  const numberSize = servers >= 100 ? 118 : 128;
  ctx.shadowColor = COLORS.purpleBright;
  ctx.shadowBlur = celebration ? 48 : 28;
  text(ctx, String(servers), 0, -4, numberSize, COLORS.white, 'center', '900');
  ctx.shadowBlur = 0;
  text(ctx, 'SERVERS', 0, 74, 23, COLORS.white, 'center', '700');
  ctx.restore();
}

function drawRightPanel(ctx, servers, t, celebration) {
  const x = 820;
  const y = 160;
  const w = 385;
  const h = 390;
  panel(ctx, x, y, w, h, celebration ? COLORS.purpleBright : COLORS.cyan);

  if (celebration) {
    ctx.save();
    glow(ctx, COLORS.purpleBright, 28);
    text(ctx, 'MILESTONE UNLOCKED', x + w / 2, y + 62, 29, COLORS.purpleBright, 'center', '900');
    ctx.shadowBlur = 0;
    text(ctx, 'BOZOS TTS HAS REACHED', x + w / 2, y + 125, 20, COLORS.white, 'center', '700');
    text(ctx, '100 SERVERS', x + w / 2, y + 165, 36, COLORS.cyan, 'center', '900');
    text(ctx, 'MORE VOICES - MORE CONNECTIONS - MORE BOZOS', x + w / 2, y + 230, 13, COLORS.muted, 'center', '700');
    text(ctx, 'THANK YOU FOR BEING PART OF THE JOURNEY', x + w / 2, y + 302, 15, COLORS.white, 'center', '700');
    text(ctx, 'BOZOS TTS', x + w / 2, y + 338, 14, COLORS.purpleBright, 'center', '900');
    ctx.restore();
    return;
  }

  const critical = servers === 99;
  const heading = critical ? 'ONE SERVER AWAY' : `${TARGET - servers} SERVERS TO GO`;
  const sub = critical ? 'FROM 100' : 'THE BOZOS ARE GETTING LOUDER';
  const breathe = 0.82 + 0.18 * (0.5 + 0.5 * Math.sin(t * 0.003));

  ctx.save();
  ctx.globalAlpha = breathe;
  text(ctx, heading, x + 24, y + 68, 28, COLORS.purpleBright, 'left', '900');
  ctx.globalAlpha = 1;
  text(ctx, sub, x + 24, y + 108, 25, COLORS.white, 'left', '900');
  text(ctx, `NEXT SERVER  ->  ${TARGET}`, x + 24, y + 170, 18, COLORS.white, 'left', '700');

  const bx = x + 24;
  const by = y + 205;
  const bw = w - 48;
  const bh = 24;
  ctx.fillStyle = '#10152a';
  ctx.strokeStyle = rgba(COLORS.cyan, 0.55);
  roundedRect(ctx, bx, by, bw, bh, 12); ctx.fill(); ctx.stroke();
  const pg = ctx.createLinearGradient(bx, 0, bx + bw, 0);
  pg.addColorStop(0, COLORS.purpleBright);
  pg.addColorStop(1, COLORS.cyan);
  roundedRect(ctx, bx + 2, by + 2, (bw - 4) * Math.min(servers / TARGET, 1), bh - 4, 10);
  ctx.fillStyle = pg;
  ctx.shadowColor = COLORS.purple;
  ctx.shadowBlur = 16;
  ctx.fill();
  ctx.shadowBlur = 0;

  text(ctx, `${servers} / ${TARGET} SERVERS`, x + w / 2, y + 274, 18, COLORS.white, 'center', '900');
  text(ctx, 'AUTOMATIC UPDATES WHEN THE COUNT CHANGES', x + w / 2, y + 312, 12, COLORS.cyan, 'center', '700');
  text(ctx, critical ? 'THE NEXT SERVER CHANGES EVERYTHING' : 'SPREADING VOICES. CONNECTING WORLDS.', x + w / 2, y + 350, 14, COLORS.muted, 'center', '500');
  ctx.restore();
}

function drawParticles(ctx, t, celebration) {
  const count = celebration ? 220 : 70;
  for (let i = 0; i < count; i++) {
    const seed = i * 13.173;
    const a = seed % TAU;
    const radius = celebration
      ? ((t * (0.05 + (seed % 17) / 180) + seed * 20) % 530)
      : ((seed * 20 + t * 0.012) % 440);
    const x = 585 + Math.cos(a) * radius;
    const y = 365 + Math.sin(a) * radius * 0.55;
    const size = celebration ? 2 + (i % 4) : 1 + (i % 3);
    ctx.globalAlpha = celebration ? Math.max(0, 1 - radius / 540) * 0.9 : 0.25;
    ctx.fillStyle = i % 3 === 0 ? COLORS.cyan : i % 3 === 1 ? COLORS.purpleBright : COLORS.white;
    ctx.fillRect(x, y, size, size * (1 + (i % 3)));
  }
  ctx.globalAlpha = 1;
}

export async function renderFrame({ servers = 99, time = 0, celebration = false }) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  drawBackground(ctx, time);
  drawFrame(ctx, time);
  drawHeader(ctx, celebration);
  await drawLogo(ctx);
  drawParticles(ctx, time, celebration);
  drawReactor(ctx, servers, time, celebration);
  drawRightPanel(ctx, servers, time, celebration);

  ctx.strokeStyle = rgba(COLORS.purple, 0.30);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(48, 590); ctx.lineTo(1232, 590); ctx.stroke();
  text(ctx, `${Math.min(servers, TARGET)} / ${TARGET} SERVERS`, 165, 625, 17, COLORS.muted, 'center', '700');
  text(ctx, celebration ? 'MORE VOICES - MORE CONNECTIONS - MORE BOZOS' : 'SPREADING VOICES. CONNECTING WORLDS.', 640, 625, 15, COLORS.muted, 'center', '500');
  text(ctx, 'POWERED BY BOZOS TTS', 1080, 625, 15, COLORS.muted, 'center', '700');
  text(ctx, celebration ? 'THANK YOU' : 'THE BOZOS ARE GETTING LOUDER', 640, 662, 16, celebration ? COLORS.purpleBright : COLORS.cyan, 'center', '900');
  return canvas;
}
