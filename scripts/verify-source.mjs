import { lstat, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const args = new Map(
  process.argv.slice(2).map((argument) => {
    const [key, ...value] = argument.replace(/^--/, '').split('=');
    return [key, value.join('=') || 'true'];
  }),
);
const mode = args.get('mode') ?? 'workspace';
if (!['workspace', 'release'].includes(mode)) {
  throw new Error(`Unsupported verification mode: ${mode}`);
}

const root = path.resolve(args.get('root') ?? '.');
const forbiddenDirs = new Set([
  'node_modules', '.next', '.vercel', '.git', 'coverage', 'logs',
  '.idea', '.vscode', '.cache', '.turbo',
]);
const forbiddenExactFiles = new Set([
  '.env', '.env.local', '.env.production', 'tsconfig.tsbuildinfo',
  'npm-debug.log', 'yarn-error.log', '.DS_Store', 'Thumbs.db',
]);
const forbiddenSuffixes = ['.log', '.swp', '.swo', '.tmp', '.zip', '.sha256'];
const secretPatterns = [
  { name: 'database URL with credentials', pattern: /postgres(?:ql)?:\/\/[^\s"'<>]+:[^\s"'<>]+@/i },
  { name: 'Resend API key', pattern: /\bre_[A-Za-z0-9_-]{20,}\b/ },
  { name: 'live Stripe secret', pattern: /\bsk_live_[A-Za-z0-9]+\b/ },
  { name: 'private key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'configured secret assignment', pattern: /(?:TURNSTILE_SECRET_KEY|CRON_SECRET|ADMIN_SESSION_SECRET|ACCESS_COOKIE_SECRET|REQUEST_FINGERPRINT_SECRET|BOOKING_WEBHOOK_SECRET)\s*=\s*[^\s#]+/ },
];
const textExtensions = new Set([
  '', '.css', '.html', '.json', '.js', '.jsx', '.md', '.mjs', '.ps1',
  '.sh', '.sql', '.ts', '.tsx', '.txt', '.yml', '.yaml',
]);
const required = [
  'package.json',
  'package-lock.json',
  'src/app/page.tsx',
  'src/app/api/audit/start/route.ts',
  'src/app/api/health/route.ts',
  'drizzle/0000_initial.sql',
  'drizzle/0001_production_hardening.sql',
  'drizzle/0002_final_mvp_hardening.sql',
  'drizzle/0003_high_end_revenue_funnel.sql',
  'drizzle/0004_follow_up_claim_hardening.sql',
  '.env.example',
  'README.md',
  'HOSTINGER_DEPLOYMENT.md',
  'DEPLOYMENT_CHECKLIST.md',
  'SECURITY.md',
];

const errors = [];
let fileCount = 0;

function relativePath(fullPath) {
  const relative = path.relative(root, fullPath).replaceAll('\\', '/');
  if (relative.startsWith('../') || path.isAbsolute(relative)) {
    throw new Error(`Path escaped verification root: ${fullPath}`);
  }
  return relative;
}

function isEnvironmentFile(name) {
  return name === '.env' || (name.startsWith('.env.') && name !== '.env.example');
}

function isForbiddenFile(name) {
  return forbiddenExactFiles.has(name) ||
    isEnvironmentFile(name) ||
    forbiddenSuffixes.some((suffix) => name.endsWith(suffix));
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    const relative = relativePath(full);

    if (entry.isSymbolicLink()) {
      errors.push(`Symbolic link is not permitted: ${relative}`);
      continue;
    }

    if (entry.isDirectory()) {
      if (forbiddenDirs.has(entry.name)) {
        if (mode === 'release') errors.push(`Forbidden directory: ${relative}`);
        continue;
      }
      await walk(full);
      continue;
    }

    if (!entry.isFile()) {
      errors.push(`Unsupported filesystem entry: ${relative}`);
      continue;
    }

    fileCount += 1;
    if (isForbiddenFile(entry.name)) {
      if (mode === 'release') errors.push(`Forbidden file: ${relative}`);
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (!textExtensions.has(extension)) continue;
    const info = await lstat(full);
    if (info.size > 2_000_000) continue;
    const content = await readFile(full, 'utf8');
    for (const { name, pattern } of secretPatterns) {
      if (pattern.test(content) && relative !== '.env.example') {
        errors.push(`Possible ${name} in ${relative}`);
      }
    }
  }
}

await walk(root);
for (const file of required) {
  try {
    const info = await lstat(path.join(root, file));
    if (!info.isFile()) errors.push(`Required path is not a file: ${file}`);
  } catch {
    errors.push(`Missing required file: ${file}`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`${mode === 'release' ? 'Release' : 'Workspace'} verification PASS (${fileCount} files).`);
