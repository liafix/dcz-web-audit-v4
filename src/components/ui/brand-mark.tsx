export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span className="grid size-9 place-items-center rounded-xl border border-blue-300/20 bg-gradient-to-br from-blue-500/25 to-violet-500/25 text-sm font-black text-white shadow-inner shadow-white/10">
        D
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-sm font-bold tracking-wide text-white">DCZ WebAudit</span>
          <span className="mt-1 block text-[10px] tracking-[0.18em] text-slate-500 uppercase">
            predbežná diagnostika
          </span>
        </span>
      )}
    </span>
  );
}
