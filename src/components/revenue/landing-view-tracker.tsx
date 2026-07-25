'use client';
import { useEffect } from 'react';
export function LandingViewTracker() { useEffect(() => { void fetch('/api/events/landing', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ event: 'landing_viewed' }) }).catch(() => undefined); }, []); return null; }
