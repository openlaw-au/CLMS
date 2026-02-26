export default function Logo({ variant = 'full', className = '' }) {
  if (variant === 'mark') {
    return (
      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white font-semibold ${className}`}>
        C
      </span>
    );
  }

  return (
    <img
      src="/assets/CLMS_logo.svg"
      alt="CLMS"
      className={`w-auto ${className || 'h-8'}`}
    />
  );
}
