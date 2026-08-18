import fs from 'node:fs/promises';
import { createCanvas } from 'canvas';
import GIFEncoder from 'gif-encoder-2';
import { FPS, WIDTH, HEIGHT, OUTPUT_WIDTH, OUTPUT_HEIGHT } from '../config.js';
import { renderFrame } from '../render/renderer.js';

export async function renderGif({ servers, celebration, output }) {
  const encoder = new GIFEncoder(OUTPUT_WIDTH, OUTPUT_HEIGHT, 'neuquant', true);
  encoder.setDelay(Math.round(1000 / FPS));
  encoder.setRepeat(0);
  // Lower quality number = better quality in gif-encoder-2. 6 is a good
  // compromise after the resolution reduction.
  encoder.setQuality(6);
  encoder.start();

  const frames = celebration ? 72 : 48;
  const downscale = createCanvas(OUTPUT_WIDTH, OUTPUT_HEIGHT);
  const dctx = downscale.getContext('2d');
  dctx.imageSmoothingEnabled = true;
  dctx.imageSmoothingQuality = 'high';

  for (let i = 0; i < frames; i++) {
    const t = i * (1000 / FPS);
    let value = servers;

    if (celebration) value = i < 10 ? 99 : 100;

    const canvas = await renderFrame({
      servers: value,
      time: t,
      celebration
    });

    dctx.clearRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
    dctx.drawImage(canvas, 0, 0, WIDTH, HEIGHT, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
    encoder.addFrame(dctx);
  }

  encoder.finish();
  const data = encoder.out.getData();
  await fs.writeFile(output, data);
  return output;
}
