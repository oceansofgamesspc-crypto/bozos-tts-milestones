import { createCanvas } from 'canvas';
import { WIDTH, HEIGHT, COLORS, MILESTONE } from '../config.js';

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function glowText(ctx, text, x, y, size, color, align = 'center') {
  ctx.save();
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${size}px Arial`;
  ctx.shadowBlur = 22;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.white;
  ctx.globalAlpha = 0.9;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawBackground(ctx, time) {
  const bg = ctx.createRadialGradient(WIDTH * 0.48, HEIGHT * 0.46, 40, WIDTH * 0.48, HEIGHT * 0.46, 760);
  bg.addColorStop(0, '#17102c');
  bg.addColorStop(0.45, '#090b17');
  bg.addColorStop(1, COLORS.background);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = COLORS.violet;
  ctx.lineWidth = 1;
  for (let x = -HEIGHT; x < WIDTH + HEIGHT; x += 54) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + HEIGHT, HEIGHT);
    ctx.stroke();
  }
  ctx.restore();

  // Slow ambient scan.
  const scanY = (time * 0.025) % HEIGHT;
  const scan = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
  scan.addColorStop(0, 'rgba(168,85,247,0)');
  scan.addColorStop(0.5, 'rgba(168,85,247,0.10)');
  scan.addColorStop(1, 'rgba(34,211,238,0)');
  ctx.fillStyle = scan;
  ctx.fillRect(0, scanY - 30, WIDTH, 60);
}

function drawPanel(ctx, x, y, w, h) {
  ctx.save();
  roundedRect(ctx, x, y, w, h, 24);
  ctx.fillStyle = COLORS.panel;
  ctx.fill();
  ctx.strokeStyle = '#2d2560';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawReactor(ctx, cx, cy, radius, progress, time, celebration = false) {
  ctx.save();
  ctx.translate(cx, cy);

  const pulse = 1 + Math.sin(time * 0.006) * 0.018;
  ctx.scale(pulse, pulse);

  // Outer aura.
  const aura = ctx.createRadialGradient(0, 0, radius * 0.35, 0, 0, radius * 1.45);
  aura.addColorStop(0, 'rgba(168,85,247,0.20)');
  aura.addColorStop(0.55, 'rgba(34,211,238,0.06)');
  aura.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 1.45, 0, Math.PI * 2);
  ctx.fill();

  // Rotating segmented reactor.
  const segments = 64;
  const start = -Math.PI / 2 + time * 0.00035;
  for (let i = 0; i < segments; i++) {
    const a0 = start + (i / segments) * Math.PI * 2;
    const a1 = a0 + (Math.PI * 2 / segments) * 0.72;
    const active = i / segments < progress;
    ctx.beginPath();
    ctx.arc(0, 0, radius, a0, a1);
    ctx.strokeStyle = active ? (i % 4 === 0 ? COLORS.cyan : COLORS.purpleBright) : '#1e1a3c';
    ctx.lineWidth = i % 5 === 0 ? 10 : 6;
    ctx.shadowBlur = active ? 18 : 0;
    ctx.shadowColor = active ? COLORS.purple : 'transparent';
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.82, 0, Math.PI * 2);
  ctx.strokeStyle = '#31265f';
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.68, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(96,165,250,0.28)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Energy ticks.
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 - time * 0.00025;
    const inner = radius * 1.08;
    const outer = radius * (1.08 + (i % 3 === 0 ? 0.09 : 0.04));
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
    ctx.strokeStyle = i % 2 ? COLORS.violet : COLORS.cyan;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  if (celebration) {
    ctx.globalAlpha = 0.75;
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + time * 0.001;
      const len = radius * (0.55 + ((i * 17) % 100) / 140);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * radius * 1.12, Math.sin(a) * radius * 1.12);
      ctx.lineTo(Math.cos(a) * (radius * 1.12 + len), Math.sin(a) * (radius * 1.12 + len));
      ctx.strokeStyle = i % 2 ? COLORS.purpleBright : COLORS.cyan;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawParticles(ctx, time, celebration = false) {
  const count = celebration ? 95 : 42;
  ctx.save();
  for (let i = 0; i < count; i++) {
    const seed = i * 91.73;
    const x = ((seed * 7.13) % WIDTH + WIDTH) % WIDTH;
    const baseY = ((seed * 3.71) % HEIGHT + HEIGHT) % HEIGHT;
    const drift = Math.sin(time * 0.0007 + i) * (celebration ? 90 : 22);
    const y = (baseY + time * (celebration ? 0.025 : 0.006) + drift) % HEIGHT;
    const size = celebration ? 2 + (i % 4) : 1 + (i % 3);
    ctx.globalAlpha = celebration ? 0.55 : 0.25;
    ctx.fillStyle = i % 3 === 0 ? COLORS.cyan : COLORS.purpleBright;
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();
}

export function renderMilestone({ servers = 99, time = 0, celebration = false } = {}) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  const progress = Math.min(servers / MILESTONE, 1);

  drawBackground(ctx, time);
  drawParticles(ctx, time, celebration);

  // Main frame.
  drawPanel(ctx, 32, 30, WIDTH - 64, HEIGHT - 60);

  // Header capsule.
  roundedRect(ctx, 350, 52, 580, 68, 22);
  ctx.fillStyle = '#0b0b18';
  ctx.fill();
  ctx.strokeStyle = COLORS.purple;
  ctx.lineWidth = 2;
  ctx.stroke();
  glowText(ctx, 'BOZOS TTS — ROAD TO 100', WIDTH / 2, 86, 31, COLORS.purpleBright);

  ctx.font = '700 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.cyan;
  ctx.fillText(celebration ? 'MILESTONE UNLOCKED' : servers >= 99 ? 'LIVE ANIMATED MILESTONE' : 'LIVE SERVER COUNT', WIDTH / 2, 145);

  // Left logo zone / brand mark.
  drawPanel(ctx, 62, 188, 260, 390);
  glowText(ctx, 'BOZOS', 192, 310, 45, COLORS.purpleBright);
  glowText(ctx, 'TTS', 192, 360, 36, COLORS.cyan);
  ctx.font = '700 14px Arial';
  ctx.fillStyle = COLORS.muted;
  ctx.fillText('VOICE • ENERGY • CHAOS', 192, 405);
  ctx.strokeStyle = COLORS.purple;
  ctx.globalAlpha = 0.65;
  ctx.beginPath();
  ctx.moveTo(112, 445);
  for (let x = 112; x <= 272; x += 8) {
    const y = 445 + Math.sin(x * 0.19 + time * 0.01) * 14;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Main reactor.
  const reactorX = 600;
  const reactorY = 370;
  drawReactor(ctx, reactorX, reactorY, 142, progress, time, celebration);

  const number = String(servers);
  glowText(ctx, number, reactorX, reactorY - 12, celebration ? 92 : 86, COLORS.purpleBright);
  ctx.font = '800 22px Arial';
  ctx.fillStyle = COLORS.white;
  ctx.textAlign = 'center';
  ctx.fillText('SERVERS', reactorX, reactorY + 62);

  // Right-side messaging.
  const rx = 785;
  if (celebration) {
    glowText(ctx, '100 SERVERS', rx + 150, 255, 43, COLORS.cyan);
    glowText(ctx, 'MILESTONE UNLOCKED', rx + 150, 315, 35, COLORS.purpleBright);
    ctx.font = '700 20px Arial';
    ctx.fillStyle = COLORS.white;
    ctx.textAlign = 'center';
    ctx.fillText('BOZOS TTS HAS REACHED 100 SERVERS!', rx + 150, 365);
    ctx.font = '600 17px Arial';
    ctx.fillStyle = COLORS.muted;
    ctx.fillText('MORE VOICES  •  MORE CONNECTIONS  •  MORE BOZOS', rx + 150, 408);
  } else {
    const critical = servers >= 99;
    glowText(ctx, critical ? 'ONE SERVER AWAY' : `${MILESTONE - servers} SERVERS TO GO`, rx + 150, 250, 37, COLORS.purpleBright);
    glowText(ctx, critical ? 'FROM 100!' : 'THE BOZOS ARE GETTING LOUDER', rx + 150, 300, 30, COLORS.white);

    roundedRect(ctx, rx, 352, 330, 54, 18);
    ctx.fillStyle = '#070a13';
    ctx.fill();
    ctx.strokeStyle = COLORS.line;
    ctx.stroke();
    const bar = ctx.createLinearGradient(rx + 12, 0, rx + 318, 0);
    bar.addColorStop(0, COLORS.purpleBright);
    bar.addColorStop(1, COLORS.cyan);
    roundedRect(ctx, rx + 12, 364, 306 * progress, 30, 14);
    ctx.fillStyle = bar;
    ctx.shadowBlur = 18;
    ctx.shadowColor = COLORS.purple;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.font = '700 17px Arial';
    ctx.fillStyle = COLORS.muted;
    ctx.textAlign = 'left';
    ctx.fillText(`${servers} / ${MILESTONE} SERVERS`, rx, 445);
  }

  // Footer.
  ctx.strokeStyle = COLORS.line;
  ctx.beginPath();
  ctx.moveTo(72, 610);
  ctx.lineTo(WIDTH - 72, 610);
  ctx.stroke();
  ctx.font = '700 16px Arial';
  ctx.fillStyle = COLORS.muted;
  ctx.textAlign = 'center';
  ctx.fillText(celebration ? 'THANK YOU FOR BEING PART OF THE JOURNEY. 💜' : 'THE BOZOS ARE GETTING LOUDER…', WIDTH / 2, 650);

  return canvas;
}
