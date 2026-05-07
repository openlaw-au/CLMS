/**
 * Notification badge dot — small circle indicator.
 * Uses brand color (primary orange) by default.
 *
 * @param {string} className — additional positioning classes (e.g. "absolute -right-0.5 -top-0.5")
 */
const toneClasses = {
  brand: 'bg-brand',
  red: 'bg-red-500',
};

export default function BadgeDot({ className = '', tone = 'brand' }) {
  return (
    <span className={`flex h-2.5 w-2.5 rounded-full ${toneClasses[tone] || toneClasses.brand} ring-2 ring-white ${className}`} />
  );
}
