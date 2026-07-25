export function ConfidenceBadge({ confidence }: { confidence: number }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/8 px-3 py-1.5 text-xs font-semibold text-cyan-100">
      <span className="size-1.5 rounded-full bg-cyan-300" />
      Dôveryhodnosť dôkazov {confidence}%
    </span>
  );
}
