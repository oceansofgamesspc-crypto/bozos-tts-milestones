import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderGif } from './animation/gif.js';

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
const output = path.join(outputDir, servers === 100 ? 'bozos-100-celebration.gif' : `bozos-${servers}.gif`);
await renderGif({ servers, celebration: servers === 100, output });
console.log(`Generated ${output}`);
