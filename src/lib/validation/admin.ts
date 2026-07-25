import { z } from 'zod';

export const adminLoginSchema = z.object({
  email: z.string().trim().email().max(254).transform((value: string) => value.toLowerCase()),
  password: z.string().min(16).max(256),
  turnstileToken: z.string().nullable().optional(),
});

export const adminLeadUpdateSchema = z.object({
  stage: z.enum(['new', 'pending_email_verification', 'verified', 'contacted', 'qualified', 'proposal', 'won', 'lost', 'needs_review']),
  notes: z.string().trim().max(3000).optional().or(z.literal('')),
  owner: z.string().trim().max(120).optional().or(z.literal('')),
  nextActionAt: z.string().datetime({ offset: true }).optional().nullable().or(z.literal('')),
});

export const adminBookingUpdateSchema = z.object({ status: z.enum(['booked', 'cancelled']) });
