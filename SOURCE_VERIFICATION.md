# Source and release verification

The project uses two deliberately separate verification modes.

## Workspace mode

```powershell
npm run verify:workspace
```

Workspace mode skips local generated directories and environment files such as `node_modules`,
`.next`, and `.env.local`. It still scans permitted source files for embedded secrets and verifies
required project files. Local dependencies and private developer configuration may therefore
exist while linting, testing, and building.

## Strict staged-release mode

```powershell
node scripts/verify-source.mjs --mode=release --root=C:\path\to\clean\staging
```

Release mode rejects:

- `node_modules`, `.next`, `.git`, `.vercel`, coverage, logs, and caches;
- `.env`, `.env.local`, `.env.production`, and other private `.env.*` files;
- editor and operating-system artifacts;
- ZIP, checksum, temporary, and log files;
- symbolic links;
- supported secret and credential patterns.

`FINALIZE_RELEASE.ps1` and `FINALIZE_RELEASE.sh` stage an explicit allowlist, run strict
verification, generate a deterministic per-file SHA-256 manifest, create the ZIP, and verify the
ZIP checksum.

No document should claim a gate passed unless the command was executed for that exact source
revision. Connected database, e-mail, Turnstile, booking, cron, Hostinger, domain, and browser
checks remain external staging requirements.
