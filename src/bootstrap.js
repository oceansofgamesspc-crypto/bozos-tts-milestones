import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.env.FONTCONFIG_FILE ||= path.join(root, 'fonts.conf');
process.env.FONTCONFIG_PATH ||= root;

await import('./service.js');
