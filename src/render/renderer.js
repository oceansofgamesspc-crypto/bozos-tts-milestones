import { createCanvas, loadImage } from 'canvas';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WIDTH, HEIGHT, COLORS, TARGET } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO = path.resolve(__dirname, '../../assets/logo/bozos-tts.png');
const TAU = Math.PI * 2;

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
  ctx.font = `${weight} ${size}px Arial`;
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

function drawBackground(ctx, t) {
  const g = ctx.createRadialGradient(570, 360, 20, 570, 360, 820);
  g.addColorStop(0, '#14142c');
  g.addColorStop(0.42, '#080b16');
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
    ctx.beginPath(); ctx.moveTo(0, y + ((t * 0.012) % 48)); ctx.lineTo(WIDTH, y + ((t * 0.012) % 48)); ctx.stroke();
  }
  ctx.restore();

  for (let i = 0; i < 75; i++) {
    const seed = i * 17.31;
    const x = (seed * 83.7) % WIDTH;
    const y = (seed * 47.9) % HEIGHT;
    const phase = t * 0.00045 + i * 0.71;
    ctx.fillStyle = i % 3 ? rgba(COLORS.purple, 0.18 + 0.18 * (0.5 + 0.5 * Math.sin(phase))) : rgba(COLORS.cyan, 0.22);
    ctx.fillRect(x + Math.sin(phase) * 13, y + Math.cos(phase * 0.73) * 8, 2, 2);
  }

  const scanY = (t * 0.03) % HEIGHT;
  const scan = ctx.createLinearGradient(0, scanY - 35, 0, scanY + 35);
  scan.addColorStop(0, 'rgba(168,85,247,0)');
  scan.addColorStop(0.5, 'rgba(168,85,247,0.07)');
  scan.addColorStop(1, 'rgba(34,211,238,0)');
  ctx.fillStyle = scan;
  ctx.fillRect(0, scanY - 35, WIDTH, 70);
}

function drawFrame(ctx, t) {
  ctx.save();
  ctx.strokeStyle = rgba(COLORS.line, 0.95);
  ctx.lineWidth = 1.5;
  roundedRect(ctx, 20, 58, 1240, 642, 20); ctx.stroke();
  ctx.strokeStyle = rgba(COLORS.purple, 0.35);
  roundedRect(ctx, 35, 74, 1210, 610, 16); ctx.stroke();
  const sweep = (t * 0.12) % 1500 - 150;
  const g = ctx.createLinearGradient(sweep - 160, 0, sweep + 160, 0);
  g.addColorStop(0, rgba(COLORS.purple, 0));
  g.addColorStop(0.5, rgba(COLORS.cyan, 0.25));
  g.addColorStop(1, rgba(COLORS.purple, 0));
  ctx.strokeStyle = g; ctx.lineWidth = 2;
  roundedRect(ctx, 35, 74, 1210, 610, 16); ctx.stroke();
  ctx.restore();
}

async function drawLogo(ctx) {
  try {
    const logo = await loadImage(await fs.readFile(LOGO));
    ctx.save();
    ctx.globalAlpha = 0.98;
    ctx.shadowColor = COLORS.purple;
    ctx.shadowBlur = 24;
    ctx.drawImage(logo, 62, 176, 300, 300);
    ctx.restore();
  } catch {
    text(ctx, 'BOZOS', 212, 300, 50, COLORS.purpleBright, 'center', '800');
    text(ctx, 'TTS', 212, 352, 34, COLORS.cyan, 'center', '800');
  }
}

function drawHeader(ctx, celebration) {
  ctx.save();
  glow(ctx, COLORS.purple, 18);
  text(ctx, celebration ? 'BOZOS TTS — 100 SERVERS' : 'BOZOS TTS — ROAD TO 100', 640, 38, 31, COLORS.white, 'center', '800');
  ctx.shadowBlur = 0;
  text(ctx, celebration ? 'MILESTONE UNLOCKED' : 'LIVE ANIMATED MILESTONE', 640, 76, 16, COLORS.cyan, 'center', '700');
  ctx.restore();
}

function drawReactor(ctx, servers, t, celebration) {
  const cx = 575, cy = 365, base = 145;
  const progress = Math.min(servers / TARGET, 1);
  const angle = t * (celebration ? 0.012 : 0.0045);

  ctx.save(); ctx.translate(cx, cy);
  const pulse = 1 + Math.sin(t * 0.004) * 0.018; ctx.scale(pulse, pulse);

  const aura = ctx.createRadialGradient(0, 0, 40, 0, 0, 230);
  aura.addColorStop(0, rgba(COLORS.purple, celebration ? 0.30 : 0.14));
  aura.addColorStop(0.48, rgba(COLORS.cyan, 0.07));
  aura.addColorStop(1, rgba(COLORS.purple, 0));
  ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(0, 0, 230, 0, TAU); ctx.fill();

  for (let ring = 0; ring < 3; ring++) {
    ctx.save(); ctx.rotate(angle * (ring % 2 ? -0.6 : 1));
    ctx.lineWidth = ring === 0 ? 9 : 3;
    ctx.strokeStyle = ring === 0 ? rgba(COLORS.purpleBright, 0.9) : rgba(COLORS.cyan, 0.34);
    glow(ctx, ring === 0 ? COLORS.purple : COLORS.cyan, ring === 0 ? 22 : 7);
    ctx.beginPath(); ctx.arc(0, 0, base + ring * 18, ring * 0.55, TAU - ring * 0.42); ctx.stroke();
    ctx.restore();
  }

  const segments = 72;
  const active = Math.round(progress * segments);
  for (let i = 0; i < segments; i++) {
    const a = -Math.PI / 2 + i * TAU / segments;
    const on = i < active;
    ctx.save(); ctx.rotate(a);
    ctx.fillStyle = on ? (i % 4 === 0 ? rgba(COLORS.cyan, 0.98) : rgba(COLORS.purpleBright, 0.94)) : rgba('#34395f', 0.42);
    ctx.shadowColor = on ? COLORS.purple : 'transparent'; ctx.shadowBlur = on ? 10 + 8 * (0.5 + 0.5 * Math.sin(t * 0.009 - i)) : 0;
    ctx.fillRect(base - 4, -3, 18, 6); ctx.restore();
  }

  ctx.save(); ctx.rotate(-angle * 0.55);
  for (let i = 0; i < 36; i++) {
    const a = i * TAU / 36;
    ctx.save(); ctx.rotate(a); ctx.fillStyle = rgba(i % 3 ? COLORS.purple : COLORS.cyan, 0.42); ctx.fillRect(104, -1, i % 3 ? 8 : 13, 2); ctx.restore();
  }
  ctx.restore();

  const arcs = celebration ? 12 : 4;
  for (let i = 0; i < arcs; i++) {
    const p = (t * 0.0012 + i * 0.23) % 1;
    const a1 = -Math.PI / 2 + p * TAU;
    ctx.strokeStyle = i % 2 ? rgba(COLORS.cyan, 0.75) : rgba(COLORS.purpleBright, 0.75);
    ctx.lineWidth = 2; glow(ctx, i % 2 ? COLORS.cyan : COLORS.purple, 12);
    ctx.beginPath(); ctx.arc(0, 0, base + 9, a1, a1 + 0.12 + 0.06 * Math.sin(i * 9.1)); ctx.stroke();
  }

  ctx.shadowColor = COLORS.purpleBright; ctx.shadowBlur = celebration ? 42 : 24;
  text(ctx, String(servers), 0, -2, servers === 100 ? 112 : 122, COLORS.white, 'center', '800');
  ctx.shadowBlur = 0; text(ctx, 'SERVERS', 0, 70, 22, COLORS.white, 'center', '700');
  ctx.restore();
}

function drawRightPanel(ctx, servers, t, celebration) {
  const x = 800, y = 160, w = 400, h = 390;
  ctx.save();
  ctx.fillStyle = rgba(COLORS.panel, 0.82); ctx.strokeStyle = rgba(COLORS.cyan, 0.30); ctx.lineWidth = 1.5;
  roundedRect(ctx, x, y, w, h, 18); ctx.fill(); ctx.stroke();

  if (celebration) {
    glow(ctx, COLORS.purpleBright, 28);
    text(ctx, 'MILESTONE UNLOCKED!', x + w / 2, y + 65, 29, COLORS.purpleBright, 'center', '800');
    text(ctx, 'BOZOS TTS HAS REACHED', x + w / 2, y + 128, 19, COLORS.white);
    text(ctx, '100 SERVERS!', x + w / 2, y + 165, 32, COLORS.cyan, 'center', '800');
    text(ctx, 'MORE VOICES  •  MORE CONNECTIONS  •  MORE BOZOS', x + w / 2, y + 228, 13, COLORS.muted);
    text(ctx, 'THANK YOU FOR BEING PART OF THE JOURNEY! 💜', x + w / 2, y + 304, 16, COLORS.white);
  } else {
    const critical = servers === 99;
    const heading = critical ? 'ONE SERVER AWAY' : `${TARGET - servers} SERVERS TO GO`;
    const sub = critical ? 'FROM 100!' : 'THE BOZOS ARE GETTING LOUDER…';
    const breathe = 0.78 + 0.22 * (0.5 + 0.5 * Math.sin(t * 0.003));
    ctx.globalAlpha = breathe;
    text(ctx, heading, x + 24, y + 75, 28, COLORS.purpleBright, 'left', '800');
    ctx.globalAlpha = 1;
    text(ctx, sub, x + 24, y + 115, 26, COLORS.white, 'left', '800');
    text(ctx, `NEXT SERVER  →  ${TARGET}`, x + 24, y + 173, 18, COLORS.white, 'left', '700');

    const bx = x + 24, by = y + 205, bw = w - 48, bh = 22;
    ctx.fillStyle = '#10152a'; ctx.strokeStyle = rgba(COLORS.cyan, 0.55); roundedRect(ctx, bx, by, bw, bh, 11); ctx.fill(); ctx.stroke();
    const pg = ctx.createLinearGradient(bx, 0, bx + bw, 0); pg.addColorStop(0, COLORS.purpleBright); pg.addColorStop(1, COLORS.cyan);
    roundedRect(ctx, bx + 2, by + 2, (bw - 4) * Math.min(servers / TARGET, 1), bh - 4, 9);
    ctx.fillStyle = pg; ctx.shadowColor = COLORS.purple; ctx.shadowBlur = 14; ctx.fill(); ctx.shadowBlur = 0;
    text(ctx, 'AUTOMATICALLY UPDATES WHEN THE COUNT CHANGES', x + w / 2, y + 292, 12, COLORS.cyan);
    text(ctx, critical ? 'THE NEXT SERVER CHANGES EVERYTHING.' : 'SPREADING VOICES. CONNECTING WORLDS.', x + w / 2, y + 332, 14, COLORS.muted);
  }
  ctx.restore();
}

function drawParticles(ctx, t, celebration) {
  const count = celebration ? 170 : 60;
  for (let i = 0; i < count; i++) {
    const seed = i * 13.173;
    const a = seed % TAU;
    const radius = celebration ? ((t * (0.05 + (seed % 17) / 180) + seed * 20) % 500) : ((seed * 20 + t * 0.012) % 430);
    const x = 575 + Math.cos(a) * radius;
    const y = 365 + Math.sin(a) * radius * 0.55;
    const size = celebration ? 2 + (i % 4) : 1 + (i % 3);
    ctx.globalAlpha = celebration ? Math.max(0, 1 - radius / 510) * 0.9 : 0.28;
    ctx.fillStyle = i % 3 === 0 ? COLORS.cyan : i % 3 === 1 ? COLORS.purpleBright : COLORS.white;
    ctx.fillRect(x, y, size, size * (1 + (i % 3)));
  }
  ctx.globalAlpha = 1;
}

export async function renderFrame({ servers = 99, time = 0, celebration = false }) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  drawBackground(ctx, time);
  drawFrame(ctx, time);
  drawHeader(ctx, celebration);
  await drawLogo(ctx);
  if (celebration) drawParticles(ctx, time, true);
  drawReactor(ctx, servers, time, celebration);
  drawRightPanel(ctx, servers, time, celebration);

  ctx.strokeStyle = rgba(COLORS.purple, 0.28); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(48, 590); ctx.lineTo(1232, 590); ctx.stroke();
  text(ctx, `${Math.min(servers, TARGET)} / ${TARGET} SERVERS`, 160, 625, 16, COLORS.muted);
  text(ctx, celebration ? 'MORE VOICES  •  MORE CONNECTIONS  •  MORE BOZOS' : 'SPREADING VOICES. CONNECTING WORLDS.', 640, 625, 15, COLORS.muted);
  text(ctx, 'POWERED BY BOZOS TTS', 1080, 625, 15, COLORS.muted);
  text(ctx, celebration ? 'THANK YOU. 💜' : 'THE BOZOS ARE GETTING LOUDER…', 640, 662, 15, celebration ? COLORS.purpleBright : COLORS.cyan, 'center', '700');
  return canvas;
}
