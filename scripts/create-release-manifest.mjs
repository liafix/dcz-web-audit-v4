import { createHash } from 'node:crypto';
import { lstat, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? '.');
const manifestName = 'FILE_MANIFEST.txt';
const rows = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    const relative = path.relative(root, full).replaceAll('\\', '/');
    if (entry.isSymbolicLink()) throw new Error(`Symbolic link is not permitted: ${relative}`);
    if (entry.isDirectory()) {
      await walk(full);
      continue;
    }
    if (!entry.isFile() || relative === manifestName) continue;
    const [content, info] = await Promise.all([readFile(full), lstat(full)]);
    const hash = createHash('sha256').update(content).digest('hex');
    rows.push(`${hash}  ${String(info.size).padStart(10, ' ')}  ${relative}`);
  }
}

await walk(root);
rows.sort((a, b) => a.localeCompare(b));
await writeFile(
  path.join(root, manifestName),
  ['# SHA-256  bytes  path', ...rows, ''].join('\n'),
  'utf8',
);
console.log(`Manifest created (${rows.length} files).`);
