export default function Skeleton({ className = '', dark = false }) {
  return (
    <div
      className={`animate-skeleton rounded-xl ${dark ? 'bg-white/20' : 'bg-slate-200/60'} ${className}`}
    />
  );
}
