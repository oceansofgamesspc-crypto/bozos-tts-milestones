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

function panel(ctx, x, y, w, h, stroke = COLORS.line, alpha = 0.88) {
  ctx.save();
  const fill = ctx.createLinearGradient(x, y, x, y + h);
  fill.addColorStop(0, rgba('#0c1020', alpha));
  fill.addColorStop(1, rgba(COLORS.panel, alpha));
  ctx.fillStyle = fill;
  ctx.strokeStyle = rgba(stroke, 0.48);
  ctx.lineWidth = 2;
  roundedRect(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function cornerBrackets(ctx, x, y, w, h, color = COLORS.purple, len = 28) {
  ctx.save();
  ctx.strokeStyle = rgba(color, 0.72);
  ctx.lineWidth = 2;
  const points = [
    [x, y, 1, 1], [x + w, y, -1, 1],
    [x, y + h, 1, -1], [x + w, y + h, -1, -1]
  ];
  for (const [px, py, sx, sy] of points) {
    ctx.beginPath();
    ctx.moveTo(px, py + sy * len); ctx.lineTo(px, py); ctx.lineTo(px + sx * len, py);
    ctx.stroke();
  }
  ctx.restore();
}

function divider(ctx, x1, y, x2, color = COLORS.line, alpha = 0.55) {
  ctx.save();
  const g = ctx.createLinearGradient(x1, 0, x2, 0);
  g.addColorStop(0, rgba(color, 0));
  g.addColorStop(0.18, rgba(color, alpha));
  g.addColorStop(0.82, rgba(color, alpha));
  g.addColorStop(1, rgba(color, 0));
  ctx.strokeStyle = g;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
  ctx.restore();
}

function drawWaveform(ctx, cx, cy, width, height, t, color = COLORS.cyan) {
  ctx.save();
  ctx.strokeStyle = rgba(color, 0.82);
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  const bars = 31;
  for (let i = 0; i < bars; i++) {
    const x = cx - width / 2 + i * (width / (bars - 1));
    const wave = Math.abs(Math.sin(t * 0.004 + i * 0.74));
    const envelope = 0.25 + 0.75 * Math.sin((i / (bars - 1)) * Math.PI);
    const hh = 3 + wave * height * envelope;
    ctx.moveTo(x, cy - hh);
    ctx.lineTo(x, cy + hh);
  }
  ctx.stroke();
  ctx.restore();
}

function drawBackground(ctx, t) {
  const g = ctx.createRadialGradient(620, 360, 20, 620, 360, 930);
  g.addColorStop(0, '#171432');
  g.addColorStop(0.36, '#090b19');
  g.addColorStop(0.75, '#04060d');
  g.addColorStop(1, '#010207');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Subtle perspective grid.
  ctx.save();
  ctx.globalAlpha = 0.085;
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

  // Sparse, slow-moving stars keep the background alive without stealing focus.
  for (let i = 0; i < 105; i++) {
    const seed = i * 17.31;
    const x = (seed * 83.7) % WIDTH;
    const y = (seed * 47.9) % HEIGHT;
    const phase = t * 0.00045 + i * 0.71;
    const pulse = 0.5 + 0.5 * Math.sin(phase);
    const cyan = i % 5 === 0;
    ctx.fillStyle = cyan
      ? rgba(COLORS.cyan, 0.10 + pulse * 0.20)
      : rgba(COLORS.purple, 0.08 + pulse * 0.16);
    const s = i % 13 === 0 ? 3 : 2;
    ctx.fillRect(x + Math.sin(phase) * 10, y + Math.cos(phase * 0.73) * 7, s, s);
  }

  // Ambient energy haze behind the reactor.
  const haze = ctx.createRadialGradient(585, 370, 40, 585, 370, 360);
  haze.addColorStop(0, rgba(COLORS.purple, 0.12));
  haze.addColorStop(0.45, rgba(COLORS.cyan, 0.045));
  haze.addColorStop(1, rgba(COLORS.purple, 0));
  ctx.fillStyle = haze;
  ctx.fillRect(180, 100, 800, 520);

  const scanY = (t * 0.03) % HEIGHT;
  const scan = ctx.createLinearGradient(0, scanY - 55, 0, scanY + 55);
  scan.addColorStop(0, 'rgba(168,85,247,0)');
  scan.addColorStop(0.5, 'rgba(168,85,247,0.065)');
  scan.addColorStop(1, 'rgba(34,211,238,0)');
  ctx.fillStyle = scan;
  ctx.fillRect(0, scanY - 55, WIDTH, 110);
}

function drawFrame(ctx, t, celebration) {
  ctx.save();
  // Outer glass frame.
  ctx.strokeStyle = rgba(COLORS.line, 0.95);
  ctx.lineWidth = 2;
  roundedRect(ctx, 18, 52, 1244, 650, 22); ctx.stroke();
  ctx.strokeStyle = rgba(COLORS.purple, 0.30);
  roundedRect(ctx, 31, 66, 1218, 622, 18); ctx.stroke();
  cornerBrackets(ctx, 31, 66, 1218, 622, celebration ? COLORS.purpleBright : COLORS.cyan, 32);

  // Moving light travels around the frame perimeter.
  const phase = (t * 0.00032) % 1;
  const perimeter = 2 * (1218 + 622);
  const dist = phase * perimeter;
  let px = 31, py = 66;
  if (dist < 1218) px += dist;
  else if (dist < 1218 + 622) { px += 1218; py += dist - 1218; }
  else if (dist < 2 * 1218 + 622) { px += 1218 - (dist - 1218 - 622); py += 622; }
  else { py += 622 - (dist - 2 * 1218 - 622); }
  ctx.fillStyle = celebration ? COLORS.purpleBright : COLORS.cyan;
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 18;
  ctx.fillRect(px - 3, py - 3, 6, 6);
  ctx.restore();
}

async function drawLogo(ctx, t) {
  try {
    const logo = await loadImage(await fs.readFile(LOGO));
    const x = 65, y = 174, w = 320, h = 300;
    // Glass plate behind the actual logo gives it a premium framed treatment.
    panel(ctx, x - 14, y - 14, w + 28, h + 28, COLORS.purple, 0.70);
    cornerBrackets(ctx, x - 14, y - 14, w + 28, h + 28, COLORS.purpleBright, 20);
    ctx.save();
    ctx.globalAlpha = 0.18 + 0.04 * Math.sin(t * 0.003);
    ctx.shadowColor = COLORS.purple;
    ctx.shadowBlur = 38;
    ctx.drawImage(logo, x, y, w, h);
    ctx.restore();
    ctx.save();
    ctx.shadowColor = COLORS.purple;
    ctx.shadowBlur = 20;
    ctx.globalAlpha = 1;
    ctx.drawImage(logo, x, y, w, h);
    ctx.restore();
  } catch {
    text(ctx, 'BOZOS', 225, 300, 58, COLORS.purpleBright, 'center', '900');
    text(ctx, 'TTS', 225, 355, 38, COLORS.cyan, 'center', '900');
  }
}

function drawHeader(ctx, t, celebration) {
  ctx.save();
  // Header pill.
  const x = 355, y = 17, w = 570, h = 48;
  const fill = ctx.createLinearGradient(x, 0, x + w, 0);
  fill.addColorStop(0, rgba(COLORS.purple, 0.20));
  fill.addColorStop(0.5, rgba('#0c1230', 0.90));
  fill.addColorStop(1, rgba(COLORS.cyan, 0.16));
  ctx.fillStyle = fill;
  ctx.strokeStyle = rgba(celebration ? COLORS.purpleBright : COLORS.cyan, 0.58);
  ctx.lineWidth = 2;
  roundedRect(ctx, x, y, w, h, 24); ctx.fill(); ctx.stroke();
  cornerBrackets(ctx, x, y, w, h, COLORS.purpleBright, 12);

  const sweepX = x + ((t * 0.12) % (w + 160)) - 80;
  const sweep = ctx.createLinearGradient(sweepX - 70, 0, sweepX + 70, 0);
  sweep.addColorStop(0, rgba(COLORS.purpleBright, 0));
  sweep.addColorStop(0.5, rgba(COLORS.white, 0.22));
  sweep.addColorStop(1, rgba(COLORS.cyan, 0));
  ctx.fillStyle = sweep;
  roundedRect(ctx, x + 3, y + 3, w - 6, h - 6, 21); ctx.fill();

  glow(ctx, COLORS.purple, celebration ? 30 : 18);
  text(ctx, celebration ? 'BOZOS TTS - 100 SERVERS' : 'BOZOS TTS - ROAD TO 100', 640, 41, 31, COLORS.white, 'center', '900');
  ctx.shadowBlur = 0;
  drawWaveform(ctx, 425, 88, 80, 8, t, COLORS.purpleBright);
  drawWaveform(ctx, 855, 88, 80, 8, t + 1.5, COLORS.cyan);
  text(ctx, celebration ? 'MILESTONE UNLOCKED' : 'LIVE ANIMATED MILESTONE', 640, 89, 14, COLORS.cyan, 'center', '900');
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
  const pulse = 1 + Math.sin(t * 0.004) * (celebration ? 0.028 : 0.016);
  ctx.scale(pulse, pulse);

  // Deep reactor core.
  const core = ctx.createRadialGradient(0, 0, 12, 0, 0, 185);
  core.addColorStop(0, rgba(COLORS.purpleBright, celebration ? 0.22 : 0.12));
  core.addColorStop(0.38, rgba(COLORS.cyan, 0.045));
  core.addColorStop(1, rgba(COLORS.purple, 0));
  ctx.fillStyle = core;
  ctx.beginPath(); ctx.arc(0, 0, 205, 0, TAU); ctx.fill();

  // Rotating technical rings.
  for (let ring = 0; ring < 4; ring++) {
    ctx.save();
    ctx.rotate(angle * (ring % 2 ? -0.65 : 1));
    ctx.lineWidth = ring === 0 ? 9 : ring === 1 ? 3 : 2;
    ctx.strokeStyle = ring === 0
      ? rgba(COLORS.purpleBright, 0.90)
      : ring === 1 ? rgba(COLORS.cyan, 0.56) : rgba(COLORS.purple, 0.25);
    glow(ctx, ring === 0 ? COLORS.purple : COLORS.cyan, ring === 0 ? 24 : 7);
    ctx.beginPath();
    const start = ring * 0.46;
    const gap = ring === 3 ? 0.22 : 0.08;
    ctx.arc(0, 0, base + ring * 19, start, TAU - gap);
    ctx.stroke();
    ctx.restore();
  }

  // 100 discrete progress segments.
  const segments = 100;
  const active = Math.round(progress * segments);
  for (let i = 0; i < segments; i++) {
    const a = -Math.PI / 2 + i * TAU / segments;
    const on = i < active;
    const breathing = 0.5 + 0.5 * Math.sin(t * 0.008 - i * 0.24);
    ctx.save();
    ctx.rotate(a);
    ctx.fillStyle = on
      ? (i % 5 === 0 ? rgba(COLORS.cyan, 0.98) : rgba(COLORS.purpleBright, 0.95))
      : rgba('#34395f', 0.34);
    ctx.shadowColor = on ? (i % 5 === 0 ? COLORS.cyan : COLORS.purple) : 'transparent';
    ctx.shadowBlur = on ? 5 + breathing * 9 : 0;
    ctx.fillRect(base + 5, -2.2, 15, 4.4);
    ctx.restore();
  }

  // Fine inner radial ticks.
  ctx.save();
  ctx.rotate(-angle * 0.55);
  for (let i = 0; i < 40; i++) {
    const a = i * TAU / 40;
    ctx.save(); ctx.rotate(a);
    ctx.fillStyle = rgba(i % 4 === 0 ? COLORS.cyan : COLORS.purple, 0.35);
    ctx.fillRect(106, -1, i % 4 === 0 ? 13 : 8, 2);
    ctx.restore();
  }
  ctx.restore();

  // Moving energy streaks.
  const streaks = celebration ? 12 : 4;
  for (let i = 0; i < streaks; i++) {
    const p = (t * 0.0012 + i * 0.19) % 1;
    const a1 = -Math.PI / 2 + p * TAU;
    ctx.strokeStyle = i % 2 ? rgba(COLORS.cyan, 0.76) : rgba(COLORS.purpleBright, 0.76);
    ctx.lineWidth = 2;
    glow(ctx, i % 2 ? COLORS.cyan : COLORS.purple, 12);
    ctx.beginPath();
    ctx.arc(0, 0, base + 9, a1, a1 + 0.10 + 0.07 * Math.sin(i * 9.1));
    ctx.stroke();
  }

  // Crosshair and center glass.
  ctx.strokeStyle = rgba(COLORS.cyan, 0.16);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, 0, 104, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-118, 0); ctx.lineTo(-98, 0); ctx.moveTo(98, 0); ctx.lineTo(118, 0); ctx.stroke();

  const numberSize = servers >= 100 ? 116 : 124;
  ctx.shadowColor = COLORS.purpleBright;
  ctx.shadowBlur = celebration ? 52 : 34;
  text(ctx, String(servers), 0, -4, numberSize, COLORS.white, 'center', '900');
  ctx.shadowBlur = 0;
  text(ctx, 'SERVERS', 0, 72, 21, COLORS.white, 'center', '900');
  text(ctx, `${Math.round(progress * 100)}%`, 0, 104, 11, COLORS.cyan, 'center', '700');
  ctx.restore();
}

function drawRightPanel(ctx, servers, t, celebration) {
  const x = 830;
  const y = 158;
  const w = 375;
  const h = 396;
  panel(ctx, x, y, w, h, celebration ? COLORS.purpleBright : COLORS.cyan, 0.91);
  cornerBrackets(ctx, x, y, w, h, celebration ? COLORS.purpleBright : COLORS.cyan, 18);

  if (celebration) {
    ctx.save();
    glow(ctx, COLORS.purpleBright, 30);
    text(ctx, 'MILESTONE UNLOCKED', x + w / 2, y + 58, 28, COLORS.purpleBright, 'center', '900');
    ctx.shadowBlur = 0;
    divider(ctx, x + 34, y + 92, x + w - 34, COLORS.purpleBright, 0.55);
    text(ctx, 'BOZOS TTS HAS REACHED', x + w / 2, y + 128, 19, COLORS.white, 'center', '700');
    text(ctx, '100 SERVERS', x + w / 2, y + 169, 38, COLORS.cyan, 'center', '900');
    text(ctx, 'MORE VOICES  •  MORE CONNECTIONS  •  MORE BOZOS', x + w / 2, y + 225, 12, COLORS.muted, 'center', '700');
    divider(ctx, x + 34, y + 252, x + w - 34, COLORS.cyan, 0.40);
    text(ctx, 'THANK YOU FOR BEING PART OF THE JOURNEY', x + w / 2, y + 294, 14, COLORS.white, 'center', '700');
    text(ctx, 'THE BOZOS ARE GETTING LOUDER', x + w / 2, y + 333, 14, COLORS.purpleBright, 'center', '900');
    ctx.restore();
    return;
  }

  const critical = servers === 99;
  const remaining = TARGET - servers;
  const heading = critical ? 'ONE SERVER AWAY' : `${remaining} SERVERS TO GO`;
  const sub = critical ? 'FROM 100' : 'THE BOZOS ARE GETTING LOUDER';
  const breathe = 0.88 + 0.12 * (0.5 + 0.5 * Math.sin(t * 0.003));

  ctx.save();
  ctx.globalAlpha = breathe;
  text(ctx, heading, x + 26, y + 58, critical ? 28 : 25, COLORS.purpleBright, 'left', '900');
  ctx.globalAlpha = 1;
  text(ctx, sub, x + 26, y + 96, critical ? 24 : 18, COLORS.white, 'left', '900');
  divider(ctx, x + 26, y + 124, x + w - 26, COLORS.purple, 0.42);
  text(ctx, `NEXT SERVER  →  ${TARGET}`, x + 26, y + 154, 17, COLORS.white, 'left', '700');

  // Animated progress bar with a traveling highlight.
  const bx = x + 26, by = y + 181, bw = w - 52, bh = 25;
  ctx.fillStyle = '#0a0f20';
  ctx.strokeStyle = rgba(COLORS.cyan, 0.62);
  ctx.lineWidth = 1.5;
  roundedRect(ctx, bx, by, bw, bh, 13); ctx.fill(); ctx.stroke();
  const fillW = (bw - 4) * progressFor(servers);
  const pg = ctx.createLinearGradient(bx, 0, bx + bw, 0);
  pg.addColorStop(0, COLORS.purpleBright);
  pg.addColorStop(0.55, '#8b5cf6');
  pg.addColorStop(1, COLORS.cyan);
  roundedRect(ctx, bx + 2, by + 2, fillW, bh - 4, 11);
  ctx.fillStyle = pg;
  ctx.shadowColor = COLORS.purple;
  ctx.shadowBlur = 18;
  ctx.fill();
  const shimmerX = bx + 4 + ((t * 0.18) % Math.max(8, fillW));
  const shimmer = ctx.createLinearGradient(shimmerX - 35, 0, shimmerX + 35, 0);
  shimmer.addColorStop(0, rgba(COLORS.white, 0));
  shimmer.addColorStop(0.5, rgba(COLORS.white, 0.32));
  shimmer.addColorStop(1, rgba(COLORS.white, 0));
  ctx.fillStyle = shimmer;
  roundedRect(ctx, bx + 2, by + 2, fillW, bh - 4, 11); ctx.fill();
  ctx.shadowBlur = 0;

  text(ctx, `${servers} / ${TARGET} SERVERS`, x + w / 2, y + 247, 18, COLORS.white, 'center', '900');
  divider(ctx, x + 26, y + 275, x + w - 26, COLORS.line, 0.65);

  drawWaveform(ctx, x + 55, y + 306, 46, 8, t, COLORS.purpleBright);
  text(ctx, 'AUTO-UPDATES WHEN COUNT CHANGES', x + 90, y + 306, 12, COLORS.cyan, 'left', '700');
  drawWaveform(ctx, x + 55, y + 346, 46, 7, t + 2, COLORS.cyan);
  text(ctx, critical ? 'THE NEXT SERVER CHANGES EVERYTHING' : 'SPREADING VOICES. CONNECTING WORLDS.', x + 90, y + 346, 11, COLORS.muted, 'left', '700');
  ctx.restore();
}

function progressFor(servers) {
  return Math.min(Math.max(servers / TARGET, 0), 1);
}

function drawParticles(ctx, t, celebration) {
  const count = celebration ? 220 : 82;
  for (let i = 0; i < count; i++) {
    const seed = i * 13.173;
    const a = seed % TAU;
    const radius = celebration
      ? ((t * (0.05 + (seed % 17) / 180) + seed * 20) % 530)
      : ((seed * 20 + t * 0.012) % 470);
    const x = 585 + Math.cos(a) * radius;
    const y = 365 + Math.sin(a) * radius * 0.55;
    const size = celebration ? 2 + (i % 4) : 1 + (i % 3);
    const alpha = celebration ? Math.max(0, 1 - radius / 540) * 0.9 : 0.22 + 0.14 * Math.sin(t * 0.002 + i);
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = i % 3 === 0 ? COLORS.cyan : i % 3 === 1 ? COLORS.purpleBright : COLORS.white;
    ctx.fillRect(x, y, size, size * (1 + (i % 3)));
  }
  ctx.globalAlpha = 1;
}

function drawFooter(ctx, servers, t, celebration) {
  divider(ctx, 52, 585, 1228, COLORS.purple, 0.42);

  // Three compact status cells.
  text(ctx, `${Math.min(servers, TARGET)} / ${TARGET} SERVERS`, 170, 617, 16, COLORS.white, 'center', '900');
  text(ctx, '●', 75, 617, 15, COLORS.purpleBright, 'center', '900');
  text(ctx, 'LIVE', 112, 617, 10, COLORS.cyan, 'center', '900');

  text(ctx, celebration ? 'MILESTONE ACHIEVED' : 'SPREADING VOICES. CONNECTING WORLDS.', 640, 617, 14, COLORS.muted, 'center', '700');
  text(ctx, 'POWERED BY BOZOS TTS', 1080, 617, 14, COLORS.white, 'center', '700');

  drawWaveform(ctx, 640, 657, 110, 8, t, celebration ? COLORS.purpleBright : COLORS.cyan);
  text(ctx, celebration ? 'THANK YOU FOR THE JOURNEY  ♥' : 'THE BOZOS ARE GETTING LOUDER  ♥', 640, 676, 15, celebration ? COLORS.purpleBright : COLORS.cyan, 'center', '900');
}

export async function renderFrame({ servers = 99, time = 0, celebration = false }) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  drawBackground(ctx, time);
  drawFrame(ctx, time, celebration);
  drawHeader(ctx, time, celebration);
  drawParticles(ctx, time, celebration);
  await drawLogo(ctx, time);
  drawReactor(ctx, servers, time, celebration);
  drawRightPanel(ctx, servers, time, celebration);
  drawFooter(ctx, servers, time, celebration);

  return canvas;
}
