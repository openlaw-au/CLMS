const variantClasses = {
  primary: 'bg-brand text-white hover:bg-brand-hover shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
  clerk: 'bg-clerk text-white hover:bg-clerk-hover shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
  secondary: 'border border-slate-300 bg-white text-text hover:bg-slate-50 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
  ghost: 'text-text-secondary hover:bg-slate-100',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
};

const sizeClasses = {
  sm: 'px-5 py-2 text-sm',
  md: 'px-8 py-3 text-base',
  lg: 'px-10 py-4 text-lg',
};

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function Button({
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={loading || props.disabled}
      className={`flex items-center justify-center gap-2 rounded-full font-medium transition-all ${variantClasses[variant]} ${sizeClasses[size]} ${loading ? 'opacity-70 pointer-events-none' : ''} ${className}`}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}
