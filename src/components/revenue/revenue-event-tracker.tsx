'use client';

import { useEffect, useRef } from 'react';

export type RevenueClientEvent =
  | 'roi_viewed'
  | 'roi_started'
  | 'qualification_started'
  | 'solution_recommendation_viewed'
  | 'case_study_impression'
  | 'booking_confirmation_viewed'
  | 'brief_cta_viewed';

export function trackRevenueEvent(token: string, event: RevenueClientEvent): void {
  void fetch(`/api/audit/${encodeURIComponent(token)}/event`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ event }),
    keepalive: true,
  }).catch(() => undefined);
}

export function RevenueEventTracker({ token, event }: { token: string; event: RevenueClientEvent }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    trackRevenueEvent(token, event);
  }, [event, token]);
  return null;
}
