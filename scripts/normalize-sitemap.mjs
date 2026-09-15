import { access, rename, unlink } from 'node:fs/promises';
import { constants } from 'node:fs';

const dist = new URL('../dist/', import.meta.url);
const source = new URL('sitemap-0.xml', dist);
const target = new URL('sitemap.xml', dist);
const index = new URL('sitemap-index.xml', dist);

await access(source, constants.R_OK);
await rename(source, target);

try {
  await unlink(index);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
