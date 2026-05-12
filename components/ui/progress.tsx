export function Progress({ value }: { value: number }) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-blue-500 transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
