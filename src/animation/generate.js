import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import GIFEncoder from 'gif-encoder-2';
import { renderMilestone } from '../render/renderer.js';
import { WIDTH, HEIGHT } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const outputDir = path.join(root, 'output');
const args = Object.fromEntries(process.argv.slice(2).map((arg) => {
  const [key, value] = arg.replace(/^--/, '').split('=');
  return [key, value ?? true];
}));

const state = Number(args.state ?? 99);
if (![99, 100].includes(state)) {
  throw new Error('Animated previews are currently scoped to state 99 or 100.');
}

await fsPromises.mkdir(outputDir, { recursive: true });

const encoder = new GIFEncoder(WIDTH, HEIGHT, 'neuquant', true);
encoder.setDelay(state === 99 ? 90 : 70);
encoder.setQuality(10);
encoder.setRepeat(0);
encoder.start();

const frameCount = state === 99 ? 64 : 84;
for (let i = 0; i < frameCount; i++) {
  const time = i * (state === 99 ? 90 : 70);

  // 100 gets a deliberately staged reveal instead of simply looping the final frame.
  const celebration = state === 100;
  const canvas = renderMilestone({
    servers: state,
    time,
    celebration
  });

  // GIFEncoder accepts a Canvas 2D context.
  encoder.addFrame(canvas.getContext('2d'));
}

encoder.finish();

const filename = state === 100 ? 'bozos-100-celebration.gif' : 'bozos-99-critical.gif';
const destination = path.join(outputDir, filename);
fs.writeFileSync(destination, encoder.out.getData());
console.log(`Generated ${destination}`);
