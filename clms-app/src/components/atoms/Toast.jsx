import Icon from './Icon';

const typeConfig = {
  success: {
    bg: 'bg-emerald-600',
    icon: 'solar:check-circle-linear',
  },
  info: {
    bg: 'bg-blue-600',
    icon: 'solar:info-circle-linear',
  },
  warning: {
    bg: 'bg-amber-500',
    icon: 'solar:danger-triangle-linear',
  },
  error: {
    bg: 'bg-red-600',
    icon: 'solar:close-circle-linear',
  },
};

export default function Toast({ message, type = 'success', icon, onDismiss }) {
  const config = typeConfig[type] || typeConfig.success;
  const iconName = icon || config.icon;

  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl ${config.bg} px-4 py-3 text-sm font-medium text-white shadow-lg`}
    >
      <Icon name={iconName} size={18} className="shrink-0 text-white/90" />
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-lg p-0.5 text-white/70 transition-colors hover:text-white"
        >
          <Icon name="solar:close-circle-linear" size={16} />
        </button>
      )}
    </div>
  );
}
