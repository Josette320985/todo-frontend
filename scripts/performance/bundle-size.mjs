import { readdir, readFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import process from 'node:process';

// Run after npm run build; no dependencies or production code changes.
const root = resolve('dist');
const assets = [];
async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await visit(path);
    else if (/\.(js|css)$/.test(entry.name)) {
      const content = await readFile(path);
      assets.push({ path: relative(root, path).replaceAll('\\', '/'), bytes: content.length, gzipBytes: gzipSync(content, { level: 9 }).length });
    }
  }
}
await visit(root);
if (!assets.some(asset => asset.path.endsWith('.js'))) throw new Error('No JavaScript build found. Run npm run build first.');
assets.sort((a, b) => a.path.localeCompare(b.path));
const totals = {};
for (const extension of ['js', 'css']) {
  const files = assets.filter(asset => asset.path.endsWith(`.${extension}`));
  totals[extension] = files.reduce((total, file) => ({ bytes: total.bytes + file.bytes, gzipBytes: total.gzipBytes + file.gzipBytes }), { bytes: 0, gzipBytes: 0 });
}
console.log(JSON.stringify({
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  dirty: Boolean(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()),
  node: process.version,
  gzipLevel: 9,
  scope: 'All emitted JS/CSS files; not measured network transfer or initial-load size.',
  assets, totals,
}, null, 2));
