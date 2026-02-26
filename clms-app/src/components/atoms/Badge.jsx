const variantClasses = {
  role: 'bg-slate-100 text-slate-700',
  status: 'bg-emerald-50 text-emerald-700',
  info: 'bg-blue-50 text-blue-700',
  default: 'bg-slate-100 text-slate-700',
};

export default function Badge({ children, variant = 'default' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}
