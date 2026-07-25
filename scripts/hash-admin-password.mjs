import { randomBytes, scryptSync } from 'node:crypto';

const password = process.argv[2];
if (!password || password.length < 14) {
  console.error('Provide an admin password with at least 14 characters.');
  process.exit(1);
}

const salt = randomBytes(16);
const digest = scryptSync(password, salt, 64);
console.log(`scrypt$${salt.toString('base64url')}$${digest.toString('base64url')}`);
