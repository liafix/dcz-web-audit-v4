# Executed release-gate report

**Date:** 25 July 2026  
**Source:** local `dcz-webaudit-next` release candidate  
**Target runtime:** Node.js 22.23.1, npm 10.9.4

## Passed gates

- lockfile validation: 611 package records;
- clean `npm ci --include=dev --no-audit --no-fund`;
- workspace source/security verification: 217 files;
- production dependency audit: 0 known vulnerabilities;
- ESLint with zero warnings;
- strict TypeScript typecheck;
- Vitest: 16 files, 48 tests;
- Next.js 15.5.22 production build;
- strict staged-release verification;
- deterministic manifest: 215 source entries;
- production ZIP creation and SHA-256 generation;
- independent ZIP extraction and strict re-verification.

The generated ZIP SHA-256 is recorded in the adjacent `.zip.sha256` sidecar. It is intentionally
not embedded in source documentation because the document itself is part of the archive.

## Build defect found and corrected

The first production build failed because the landing audit form used `useSearchParams()` without
a Suspense boundary. The form now reads campaign parameters at submit time in the browser. The
subsequent Node 22 production build passed.

## Not covered by this local gate

- live Neon migration and schema comparison;
- Resend, Turnstile, PageSpeed, monitoring, and booking-provider connectivity;
- Hostinger deployment, reverse-proxy timeout, cron execution, domain, and HTTPS;
- full browser, mobile, accessibility, and real-site staging matrix;
- GitHub Actions on the published commit.

The source and release artifact are build-tested. Production readiness still requires the
connected staging and deployment checklist; this report does not claim that Hostinger deployment
has already succeeded.
