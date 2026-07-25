import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const destinationArgument = process.argv[2];
if (!destinationArgument) throw new Error('Usage: node scripts/stage-release.mjs <destination>');

const root = path.resolve('.');
const destination = path.resolve(destinationArgument);
const relativeDestination = path.relative(root, destination);
if (!relativeDestination.startsWith('..') && !path.isAbsolute(relativeDestination)) {
  throw new Error('Release staging directory must be outside the project root.');
}

const rootFiles = [
  '.env.example', '.gitignore', '.nvmrc',
  'ARCHITECTURE.md', 'BACKUP_ROLLBACK.md', 'CALIBRATION_REPORT.md', 'CHANGELOG.md',
  'DEPLOYMENT_CHECKLIST.md', 'drizzle.config.ts', 'eslint.config.mjs',
  'FINAL_IMPLEMENTATION_REPORT.md', 'FINALIZE_RELEASE.ps1', 'FINALIZE_RELEASE.sh',
  'HOSTINGER_DEPLOYMENT.md', 'IMPLEMENTATION_REPORT.md', 'LICENSE',
  'MANUAL_STAGING_QA.md', 'next-env.d.ts', 'next.config.ts', 'package-lock.json',
  'package.json', 'postcss.config.mjs', 'PREPARE_RELEASE.ps1', 'PREPARE_RELEASE.sh',
  'README.md', 'SECURITY.md', 'SOURCE_VERIFICATION.md', 'TEST_REPORT.md',
  'tsconfig.json', 'vercel.json', 'VERCEL_DEPLOYMENT.md', 'vitest.config.ts',
];
const directories = ['.github', 'docs', 'drizzle', 'public', 'scripts', 'src', 'tests'];

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
for (const file of rootFiles) {
  await cp(path.join(root, file), path.join(destination, file), { force: false });
}
for (const directory of directories) {
  await cp(path.join(root, directory), path.join(destination, directory), {
    recursive: true,
    force: false,
    filter(source) {
      const name = path.basename(source);
      return !['node_modules', '.next', '.vercel', '.git', 'coverage', 'logs', '.idea', '.vscode', '.cache'].includes(name);
    },
  });
}
console.log(`Release source staged at ${destination}`);
