export function ScoreRing({ score, coverage, label = 'Skóre analyzovaných signálov' }: { score: number | null; coverage: number; label?: string }) {
  const effective = score ?? 0;
  const ringColor = score === null ? '#64748b' : score >= 75 ? '#34d399' : score >= 50 ? '#60a5fa' : '#fb7185';
  const aria = score === null ? `${label}: nedostatočné dáta, pokrytie ${coverage} percent` : `${label}: ${score} zo 100, pokrytie ${coverage} percent`;
  return (
    <div className="flex flex-col items-center">
      <div className="score-ring relative grid size-44 place-items-center rounded-full p-3" style={{ '--score': effective, '--ring-color': ringColor } as React.CSSProperties} aria-label={aria}>
        <div className="grid size-full place-items-center rounded-full border border-white/8 bg-[#0d1220] shadow-inner shadow-black/40">
          <div className="text-center">
            {score === null ? <><span className="block text-lg font-bold tracking-tight text-white">Málo dát</span><span className="text-xs text-slate-500">na presné skóre</span></> : <><span className="block text-5xl font-bold tracking-tight text-white">{score}</span><span className="text-sm text-slate-500">zo 100</span></>}
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-sm font-semibold text-slate-300">{label}</p>
      <p className="mt-1 text-xs text-slate-500">Pokrytie merania {coverage}%</p>
    </div>
  );
}
