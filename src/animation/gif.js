import fs from 'node:fs/promises';
import { createCanvas } from 'canvas';
import GIFEncoder from 'gif-encoder-2';
import { FPS, WIDTH, HEIGHT, OUTPUT_WIDTH, OUTPUT_HEIGHT, MAX_UPLOAD_BYTES } from '../config.js';
import { renderFrame } from '../render/renderer.js';

async function encodeFrames(frames, width, height) {
  const encoder = new GIFEncoder(width, height, 'neuquant', true);
  encoder.setDelay(Math.round(1000 / FPS));
  encoder.setRepeat(0);
  encoder.setQuality(8);
  encoder.start();

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  for (const frame of frames) {
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(frame, 0, 0, WIDTH, HEIGHT, 0, 0, width, height);
    encoder.addFrame(ctx);
  }

  encoder.finish();
  return encoder.out.getData();
}

export async function renderGif({ servers, celebration, output }) {
  // Keep the authored renderer at 1280x720, then encode a compact Discord
  // version. Celebration animations are intentionally shorter to control size.
  const frameCount = celebration ? 60 : 40;
  const frames = [];

  for (let i = 0; i < frameCount; i++) {
    const t = i * (1000 / FPS);
    const value = celebration ? (i < 10 ? 99 : 100) : servers;
    frames.push(await renderFrame({ servers: value, time: t, celebration }));
  }

  let data = await encodeFrames(frames, OUTPUT_WIDTH, OUTPUT_HEIGHT);

  // Discord rejects oversized multipart bodies. If the first encode is still
  // too large, fall back to 640x360 without sacrificing the 16:9 composition.
  if (data.length > MAX_UPLOAD_BYTES) {
    data = await encodeFrames(frames, 640, 360);
  }

  if (data.length > MAX_UPLOAD_BYTES) {
    throw new Error(`Generated milestone GIF is ${data.length} bytes, still above ${MAX_UPLOAD_BYTES} bytes after compression.`);
  }

  await fs.writeFile(output, data);
  console.log(`Generated ${output}: ${(data.length / 1024 / 1024).toFixed(2)} MiB`);
  return output;
}
