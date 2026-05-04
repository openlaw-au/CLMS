const TONE_CLASS_MAP = {
  amber: {
    badge: 'bg-amber-100 text-amber-700',
    count: 'text-amber-700',
    swatch: 'bg-amber-100 text-amber-700',
  },
  brand: {
    badge: 'bg-brand/10 text-brand',
    count: 'text-brand',
    swatch: 'bg-brand/10 text-brand',
  },
  emerald: {
    badge: 'bg-emerald-100 text-emerald-600',
    count: 'text-emerald-600',
    swatch: 'bg-emerald-100 text-emerald-600',
  },
  info: {
    badge: 'bg-blue-100 text-blue-700',
    count: 'text-blue-700',
    swatch: 'bg-blue-100 text-blue-700',
  },
  neutral: {
    badge: 'bg-slate-200 text-text-muted',
    count: 'text-text',
    swatch: 'bg-slate-100 text-text-muted',
  },
  red: {
    badge: 'bg-red-50 text-red-600',
    count: 'text-red-600',
    swatch: 'bg-red-50 text-red-600',
  },
};

export function getToneClasses(tone = 'neutral') {
  return TONE_CLASS_MAP[tone] ?? TONE_CLASS_MAP.neutral;
}

export function getMetricIconClasses(iconBg = 'neutral') {
  return TONE_CLASS_MAP[iconBg]?.swatch ?? iconBg;
}
