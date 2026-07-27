import 'server-only';

function booleanEnv(name: string, fallback = false): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  if (!value) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value);
}

export function appUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;
  if (isProduction() && !booleanEnv('NEXT_PUBLIC_PREVENT_INDEXING')) {
    throw new Error('NEXT_PUBLIC_APP_URL is required for a public production deployment.');
  }
  return 'http://localhost:3000';
}

export function requiredSecret(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isLiveProduction(): boolean {
  if (process.env.VERCEL_ENV === 'production') return true;
  return isProduction() && !booleanEnv('NEXT_PUBLIC_PREVENT_INDEXING');
}

export function turnstileEnabled(): boolean {
  return booleanEnv('TURNSTILE_ENABLED', false);
}

export function turnstileSiteKey(): string | null {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || null;
}

export function productionConfigurationIssues(): string[] {
  const issues: string[] = [];
  const required = [
    'DATABASE_URL',
    'REQUEST_FINGERPRINT_SECRET',
    'ACCESS_COOKIE_SECRET',
    'FUNNEL_SESSION_SECRET',
    'ADMIN_SESSION_SECRET',
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD_HASH',
  ];
  for (const key of required) {
    if (!process.env[key]?.trim()) issues.push(key);
  }
  for (const key of [
    'REQUEST_FINGERPRINT_SECRET',
    'ACCESS_COOKIE_SECRET',
    'FUNNEL_SESSION_SECRET',
    'ADMIN_SESSION_SECRET',
  ]) {
    const value = process.env[key]?.trim();
    if (value && Buffer.byteLength(value, 'utf8') < 32) issues.push(`${key}_MIN_32_BYTES`);
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl) {
    try {
      const parsed = new URL(databaseUrl);
      if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) issues.push('DATABASE_URL_POSTGRES');
    } catch {
      issues.push('DATABASE_URL_VALID');
    }
  }

  if (isLiveProduction()) {
    const publicUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (!publicUrl) issues.push('NEXT_PUBLIC_APP_URL');
    else {
      try { if (new URL(publicUrl).protocol !== 'https:') issues.push('NEXT_PUBLIC_APP_URL_HTTPS'); }
      catch { issues.push('NEXT_PUBLIC_APP_URL_VALID'); }
    }
    if (!turnstileEnabled()) issues.push('TURNSTILE_ENABLED');
    if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()) {
      issues.push('NEXT_PUBLIC_TURNSTILE_SITE_KEY');
    }
    if (!process.env.TURNSTILE_SECRET_KEY?.trim()) issues.push('TURNSTILE_SECRET_KEY');
    if (!process.env.RESEND_API_KEY?.trim()) issues.push('RESEND_API_KEY');
    if (!process.env.MAIL_FROM?.trim()) issues.push('MAIL_FROM');
    if (!process.env.DCZ_NOTIFICATION_EMAIL?.trim()) issues.push('DCZ_NOTIFICATION_EMAIL');
    for (const key of ['CRON_SECRET', 'BOOKING_WEBHOOK_SECRET', 'TURNSTILE_SECRET_KEY']) {
      const value = process.env[key]?.trim();
      if (!value) issues.push(key);
      else if (Buffer.byteLength(value, 'utf8') < 32) issues.push(`${key}_MIN_32_BYTES`);
    }
    const bookingUrl = process.env.DIAGNOSTIC_BOOKING_URL?.trim();
    if (!bookingUrl) issues.push('DIAGNOSTIC_BOOKING_URL');
    else {
      try {
        if (new URL(bookingUrl).protocol !== 'https:') issues.push('DIAGNOSTIC_BOOKING_URL_HTTPS');
      } catch {
        issues.push('DIAGNOSTIC_BOOKING_URL_VALID');
      }
    }
    const monitoringWebhook = process.env.MONITORING_WEBHOOK_URL?.trim();
    if (!monitoringWebhook) issues.push('MONITORING_WEBHOOK_URL');
    else {
      try {
        if (new URL(monitoringWebhook).protocol !== 'https:') issues.push('MONITORING_WEBHOOK_URL_HTTPS');
      } catch {
        issues.push('MONITORING_WEBHOOK_URL_VALID');
      }
    }
  }

  return [...new Set(issues)];
}
