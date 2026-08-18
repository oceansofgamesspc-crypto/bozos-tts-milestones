import fs from 'node:fs/promises';
import sharp from 'sharp';
import { FPS, WIDTH, HEIGHT, MAX_UPLOAD_BYTES } from '../config.js';
import { renderFrame } from '../render/renderer.js';

async function encodeAnimatedWebP(frames) {
  // Convert Canvas output to RGBA and stack frames vertically. Sharp can then
  // treat the tall raw image as a multi-page animation and encode it as WebP.
  const rawFrames = [];
  for (const frame of frames) {
    const png = frame.toBuffer('image/png');
    const raw = await sharp(png).ensureAlpha().raw().toBuffer();
    rawFrames.push(raw);
  }

  const stacked = Buffer.concat(rawFrames);
  const delay = new Array(frames.length).fill(Math.round(1000 / FPS));

  return sharp(stacked, {
    raw: {
      width: WIDTH,
      height: HEIGHT * frames.length,
      channels: 4,
      pageHeight: HEIGHT
    }
  })
    .webp({ quality: 88, effort: 6, loop: 0, delay })
    .toBuffer();
}

export async function renderGif({ servers, celebration, output }) {
  // 5 seconds for the live state, 6.5 seconds for the 100-server event.
  // WebP keeps the full 1280x720 canvas and avoids GIF's 256-color ceiling.
  const frameCount = celebration ? 52 : 40;
  const frames = [];

  for (let i = 0; i < frameCount; i++) {
    const t = i * (1000 / FPS);
    let value = servers;
    let isCelebration = false;

    if (celebration) {
      // First 1.5 seconds: 99 charging. Then slam into 100 and celebrate.
      if (i < 12) {
        value = 99;
        isCelebration = false;
      } else {
        value = 100;
        isCelebration = true;
      }
    }

    frames.push(await renderFrame({
      servers: value,
      time: t,
      celebration: isCelebration
    }));
  }

  let data = await encodeAnimatedWebP(frames);

  // If an unusually large render exceeds the standard non-Nitro upload limit,
  // lower quality before sacrificing resolution. WebP is specifically used
  // here because Discord supports animated WebP attachments/embeds and it
  // preserves far more color/detail than GIF.
  if (data.length > MAX_UPLOAD_BYTES) {
    const rawFrames = [];
    for (const frame of frames) {
      const raw = await sharp(frame.toBuffer('image/png')).ensureAlpha().raw().toBuffer();
      rawFrames.push(raw);
    }
    const stacked = Buffer.concat(rawFrames);
    const delay = new Array(frames.length).fill(Math.round(1000 / FPS));
    data = await sharp(stacked, {
      raw: { width: WIDTH, height: HEIGHT * frames.length, channels: 4, pageHeight: HEIGHT }
    })
      .webp({ quality: 72, effort: 6, loop: 0, delay })
      .toBuffer();
  }

  if (data.length > MAX_UPLOAD_BYTES) {
    throw new Error(`Generated animated WebP is ${(data.length / 1024 / 1024).toFixed(2)} MiB, above the ${MAX_UPLOAD_BYTES / 1024 / 1024} MiB safety limit.`);
  }

  await fs.writeFile(output, data);
  console.log(`Generated ${output}: ${(data.length / 1024 / 1024).toFixed(2)} MiB`);
  return output;
}
