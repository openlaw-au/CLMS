import { forwardRef } from 'react';

/**
 * LabeledInput — label above, placeholder inside at matching font size.
 *
 * Props:
 *  - label: text shown above the input
 *  - size: 'sm' | 'md' | 'lg'
 *  - All standard input props forwarded
 */

const sizeConfig = {
  sm: {
    input: 'text-sm px-4 py-2',
  },
  md: {
    input: 'text-sm px-4 py-3',
  },
  lg: {
    input: 'font-serif text-3xl px-4 py-2',
  },
};

const LabeledInput = forwardRef(function LabeledInput(
  { label, size = 'md', className = '', ...props },
  ref,
) {
  const cfg = sizeConfig[size] || sizeConfig.md;

  return (
    <div className={className}>
      {label && (
        <label className="mb-1 block text-xs font-medium text-text-secondary">{label}</label>
      )}
      <input
        ref={ref}
        className={`w-full rounded-xl border border-border bg-white text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 ${cfg.input}`}
        {...props}
      />
    </div>
  );
});

export default LabeledInput;
