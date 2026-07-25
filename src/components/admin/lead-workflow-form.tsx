'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import type { LeadRecord } from '@/lib/db/schema';

const stages = ['new','pending_email_verification','verified','needs_review','contacted','qualified','proposal','won','lost'] as const;
export function LeadWorkflowForm({ lead }: { lead: LeadRecord }) {
  const [pending,setPending]=useState(false); const [message,setMessage]=useState<string|null>(null); const [error,setError]=useState<string|null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPending(true); setMessage(null); setError(null); try { const form=new FormData(event.currentTarget); const next=form.get('nextActionAt'); const response=await fetch(`/api/admin/leads/${lead.id}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({stage:form.get('stage'),notes:form.get('notes'),owner:form.get('owner'),nextActionAt:next ? new Date(String(next)).toISOString() : null})}); const data=await response.json() as {error?:string;errorId?:string}; if(!response.ok) throw new Error(`${data.error??'Lead sa nepodarilo uložiť.'}${data.errorId?` ID: ${data.errorId}`:''}`); setMessage('Zmeny boli uložené.'); } catch(e){ setError(e instanceof Error?e.message:'Lead sa nepodarilo uložiť.'); } finally { setPending(false); } }
  const localDate=lead.nextActionAt ? new Date(lead.nextActionAt.getTime()-lead.nextActionAt.getTimezoneOffset()*60000).toISOString().slice(0,16) : '';
  return <form onSubmit={submit} className="space-y-4"><label className="space-y-2 text-sm text-slate-300"><span>Stav</span><select name="stage" defaultValue={lead.stage} className="focus-ring min-h-12 w-full rounded-xl border border-white/12 bg-black/20 px-4 text-sm text-white">{stages.map(stage=><option key={stage} value={stage}>{stage}</option>)}</select></label><label className="space-y-2 text-sm text-slate-300"><span>Vlastník</span><Input name="owner" defaultValue={lead.owner??''} placeholder="Dušan / obchodník" /></label><label className="space-y-2 text-sm text-slate-300"><span>Ďalšia akcia</span><Input type="datetime-local" name="nextActionAt" defaultValue={localDate} /></label><label className="space-y-2 text-sm text-slate-300"><span>Interná poznámka</span><Textarea name="notes" defaultValue={lead.notes??''} /></label><Button type="submit" disabled={pending} className="w-full">{pending?'Ukladáme…':'Uložiť workflow'}</Button>{message&&<p className="text-sm text-emerald-200">{message}</p>}{error&&<p className="text-sm text-red-200">{error}</p>}</form>;
}
