import type { BusinessModel, BusinessVertical, InvestmentBand, LeadPriority, MoneyLeakCategory, ProjectTimeline, DecisionRole, PrimaryConversionGoal } from '@/lib/revenue/types';

export const verticalLabel: Record<BusinessVertical, string> = {
  b2b_saas: 'B2B SaaS', developer_real_estate: 'Developer / reality', hotel_hospitality: 'Hotel / hospitality',
  fitness_wellness: 'Fitness / wellness', clinic_health: 'Klinika / zdravotníctvo', professional_services: 'Profesionálne služby',
  ecommerce: 'E-commerce', local_service: 'Lokálna služba', unknown: 'Neurčená vertikála',
};
export const businessModelLabel: Record<BusinessModel, string> = {
  lead_generation: 'Získavanie dopytov', booking: 'Rezervácie', ecommerce: 'E-commerce', demo_sales: 'Demo / konzultačný predaj',
  subscription: 'Predplatné / členstvo', information_only: 'Prezentácia / informácie', unknown: 'Neurčený model',
};
export const leakCategoryLabel: Record<MoneyLeakCategory, string> = {
  traffic_acquisition: 'Akvizícia návštevnosti', message_clarity: 'Zrozumiteľnosť ponuky', trust: 'Dôvera',
  conversion: 'Konverzia', transaction: 'Obchodný krok', follow_up_measurement: 'Follow-up a meranie',
};
export const investmentLabel: Record<InvestmentBand, string> = {
  under_3000: 'do 3 000 €', '3000_7500': '3 000–7 500 €', '7500_15000': '7 500–15 000 €',
  '15000_30000': '15 000–30 000 €', '30000_plus': '30 000 €+', business_case_first: 'Najskôr business case',
};
export const timelineLabel: Record<ProjectTimeline, string> = { immediately: 'Ihneď', '30_days': 'Do 30 dní', '90_days': 'Do 90 dní', later: 'Neskôr' };
export const decisionRoleLabel: Record<DecisionRole, string> = { decision_maker: 'Rozhodovateľ', co_decision_maker: 'Spolurozhodujem', researcher: 'Pripravujem podklady' };
export const goalLabel: Record<PrimaryConversionGoal, string> = { b2b_leads: 'Kvalifikované B2B dopyty', bookings: 'Rezervácie', orders: 'Objednávky/predaj', demo_consultations: 'Demo alebo konzultácie', subscriptions: 'Registrácie/predplatné', other: 'Iný cieľ' };
export const priorityLabel: Record<LeadPriority, string> = { A: 'Priority A', B: 'Priority B', C: 'Priority C', nurture: 'Nurture', disqualified: 'Disqualified' };
