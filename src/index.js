import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMilestone } from './render/renderer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'output');

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=');
    return [key, value ?? true];
  })
);

const servers = Number(args.state ?? 99);
if (!Number.isInteger(servers) || servers < 0 || servers > 100) {
  throw new Error('state must be an integer from 0 to 100');
}

await fs.mkdir(outputDir, { recursive: true });

const celebration = servers === 100;
const canvas = renderMilestone({
  servers,
  time: celebration ? 2400 : 1600,
  celebration
});

const filename = celebration ? 'milestone-100.png' : `milestone-${servers}.png`;
const destination = path.join(outputDir, filename);
await fs.writeFile(destination, canvas.toBuffer('image/png'));

console.log(`Generated ${destination}`);
