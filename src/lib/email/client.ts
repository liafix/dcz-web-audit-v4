import 'server-only';
import { Resend } from 'resend';
import { logApplicationEvent } from '@/lib/monitoring/logger';

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  idempotencyKey: string;
  replyTo?: string;
}


function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p>|<\/div>|<\/h[1-6]>|<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function sendEmail(input: SendEmailInput): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.MAIL_FROM?.trim();
  if (!apiKey || !from) return { sent: false, reason: 'email_not_configured' };

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send(
      {
        from,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text ?? htmlToPlainText(input.html),
        ...(input.replyTo ? { replyTo: input.replyTo } : {}),
      },
      { idempotencyKey: input.idempotencyKey },
    );

    if (error) {
      await logApplicationEvent({ level: 'error', event: 'email_provider_error', context: { reason: error.message, subject: input.subject } });
      return { sent: false, reason: error.message.slice(0, 200) };
    }
    return { sent: true };
  } catch (error) {
    await logApplicationEvent({ level: 'error', event: 'email_send_failed', error, context: { subject: input.subject } });
    return {
      sent: false,
      reason: error instanceof Error ? error.message.slice(0, 200) : 'email_provider_failed',
    };
  }
}
