import { readFile } from 'node:fs/promises';

const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
const lockfile = JSON.parse(await readFile('package-lock.json', 'utf8'));
const errors = [];
const root = lockfile.packages?.[''];

if (lockfile.lockfileVersion !== 3) errors.push('package-lock.json must use lockfileVersion 3.');
if (!root) errors.push('package-lock.json is missing the root package record.');
if (root?.name !== packageJson.name) errors.push('Package name differs between package.json and package-lock.json.');
if (root?.version !== packageJson.version) errors.push('Package version differs between package.json and package-lock.json.');
if (packageJson.packageManager !== 'npm@10.9.4') errors.push('packageManager must be npm@10.9.4.');
if (packageJson.engines?.node !== '22.x') errors.push('engines.node must be exactly 22.x.');

for (const section of ['dependencies', 'devDependencies', 'optionalDependencies']) {
  const expected = packageJson[section] ?? {};
  const actual = root?.[section] ?? {};
  for (const [name, version] of Object.entries(expected)) {
    if (actual[name] !== version) errors.push(`${section}.${name} differs between package.json and package-lock.json.`);
  }
  for (const name of Object.keys(actual)) {
    if (!(name in expected)) errors.push(`package-lock.json has unexpected root ${section}.${name}.`);
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Lockfile verification PASS (${Object.keys(lockfile.packages ?? {}).length} package records).`);
