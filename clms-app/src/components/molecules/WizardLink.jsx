import Icon from '../atoms/Icon';

export default function WizardLink({ icon, label, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-brand hover:text-brand-hover ${className}`}
    >
      <Icon name={icon} size={16} />
      <span>{label}</span>
    </button>
  );
}
