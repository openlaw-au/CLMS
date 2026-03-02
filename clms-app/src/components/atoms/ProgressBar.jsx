export default function ProgressBar({ current, total }) {
  const width = Math.min(100, Math.round((current / total) * 100));

  return (
    <div className="space-y-2">
      <div className="h-2 rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="text-xs font-medium text-text-tertiary">Step {current} of {total}</p>
    </div>
  );
}
