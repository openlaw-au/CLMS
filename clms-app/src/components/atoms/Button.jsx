const variantClasses = {
  primary: 'bg-brand text-white hover:bg-brand-hover shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
  clerk: 'bg-clerk text-white hover:bg-clerk-hover shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
  secondary: 'border border-slate-300 bg-white text-text hover:bg-slate-50 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
  ghost: 'text-text-secondary hover:bg-slate-100',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]',
};

const sizeClasses = {
  sm: 'px-5 py-2 text-sm',
  md: 'px-8 py-3 text-base',
  lg: 'px-10 py-4 text-lg',
};

export default function Button({
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={`flex items-center justify-center gap-2 rounded-full font-medium transition-all ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
