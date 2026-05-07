const toneClasses = {
  brand: 'bg-brand/10 text-brand',
  blue: 'bg-blue-500/10 text-blue-600',
  green: 'bg-green-500/10 text-green-600',
  violet: 'bg-purple-500/10 text-purple-600',
};

export default function ReviewCard({ quote, name, chamber, initials, tone = 'brand', className = '' }) {
  return (
    <article className={`review-card ${className}`}>
      <div className="mb-2 flex items-center gap-2">
        <div className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${toneClasses[tone]}`}>
          {initials}
        </div>
        <div>
          <p className="text-[11px] font-semibold text-text">{name}</p>
          <p className="text-[9px] text-text-muted">{chamber}</p>
        </div>
      </div>
      <p className="text-2xs leading-relaxed text-slate-600">"{quote}"</p>
    </article>
  );
}
