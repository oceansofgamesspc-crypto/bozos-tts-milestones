import fs from 'node:fs/promises';
import GIFEncoder from 'gif-encoder-2';
import { FPS, WIDTH, HEIGHT } from '../config.js';
import { renderFrame } from '../render/renderer.js';

export async function renderGif({ servers, celebration, output }) {
  const encoder = new GIFEncoder(WIDTH, HEIGHT, 'neuquant', true);
  encoder.setDelay(Math.round(1000 / FPS));
  encoder.setRepeat(0);
  encoder.setQuality(8);
  encoder.start();

  // 99 is an ambient critical loop. 100 is a one-shot-style celebration
  // followed by a calm achieved-state loop, represented in one looping GIF.
  const frames = celebration ? 108 : 84;
  const criticalStart = Math.max(0, frames - 18);

  for (let i = 0; i < frames; i++) {
    const t = i * (1000 / FPS);
    let value = servers;
    let celebrationFrame = celebration;

    if (celebration) {
      // Build a readable 99 → 100 transition before the celebration settles.
      if (i < 14) value = 99;
      else value = 100;
    } else if (servers === 99) {
      // Keep the 99 state visually tense without changing the actual count.
      value = 99;
    } else if (servers < 99 && i >= criticalStart) {
      value = servers;
    }

    const canvas = await renderFrame({
      servers: value,
      time: t,
      celebration: celebrationFrame
    });
    encoder.addFrame(canvas.getContext('2d'));
  }

  encoder.finish();
  await fs.writeFile(output, encoder.out.getData());
  return output;
}
