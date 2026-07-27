import { z } from 'zod';

const attribution = {
  utmSource: z.string().trim().max(160).optional().nullable(),
  utmMedium: z.string().trim().max(160).optional().nullable(),
  utmCampaign: z.string().trim().max(200).optional().nullable(),
  referrerHost: z.string().trim().max(255).optional().nullable(),
};

export const startAuditSchema = z.object({
  url: z.string().trim().min(3).max(2048),
  website: z.string().max(0).optional().default(''),
  turnstileToken: z.string().nullable().optional(),
  ...attribution,
});

export const unlockAuditSchema = z.object({
  email: z.string().trim().email().max(254).transform((value: string) => value.toLowerCase()),
  name: z.string().trim().max(120).optional().or(z.literal('')),
  company: z.string().trim().max(160).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  primaryGoal: z.string().trim().max(500).optional().or(z.literal('')),
  marketingConsent: z.boolean().optional().default(false),
  website: z.string().max(0).optional().default(''),
  turnstileToken: z.string().nullable().optional(),
});

export const resendAuditSchema = z.object({
  email: z.string().trim().email().max(254).transform((value: string) => value.toLowerCase()),
  turnstileToken: z.string().nullable().optional(),
});

export const manualReviewSchema = z.object({
  email: z.string().trim().email().max(254).transform((value: string) => value.toLowerCase()),
  name: z.string().trim().min(2).max(120),
  company: z.string().trim().max(160).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  message: z.string().trim().min(10).max(1200),
  turnstileToken: z.string().nullable().optional(),
});

const optionalNonNegativeNumber = z.number().finite().min(0).max(1_000_000_000).nullable();

export const roiScenarioSchema = z.object({
  monthlyVisitors: optionalNonNegativeNumber,
  monthlyConversions: optionalNonNegativeNumber,
  averageCustomerValue: optionalNonNegativeNumber,
  closeRate: z.number().finite().min(0).max(100).nullable(),
  grossMargin: z.number().finite().min(0).max(100).nullable(),
  currency: z.literal('EUR').default('EUR'),
});

export const qualificationSchema = z.object({
  primaryConversionGoal: z.enum(['b2b_leads', 'bookings', 'orders', 'demo_consultations', 'subscriptions', 'other']),
  decisionRole: z.enum(['decision_maker', 'co_decision_maker', 'researcher']),
  projectTimeline: z.enum(['immediately', '30_days', '90_days', 'later']),
  investmentBand: z.enum(['under_3000', '3000_7500', '7500_15000', '15000_30000', '30000_plus', 'business_case_first']),
  verticalConfirmed: z.enum(['b2b_saas', 'developer_real_estate', 'hotel_hospitality', 'fitness_wellness', 'clinic_health', 'professional_services', 'ecommerce', 'local_service', 'unknown']).optional().nullable(),
  businessModelConfirmed: z.enum(['lead_generation', 'booking', 'ecommerce', 'demo_sales', 'subscription', 'information_only', 'unknown']).optional().nullable(),
});

export const bookingWebhookSchema = z.object({
  publicReference: z.string().trim().min(8).max(100),
  status: z.enum(['booked', 'cancelled']),
  providerEventId: z.string().trim().max(200).optional().nullable(),
});
