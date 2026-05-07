import Icon from '../atoms/Icon';
import { formatShortDate } from '../../utils/dateFormatters';

export default function DueDateLine({
  dueDate,
  overdue = false,
  extended = false,
  className = '',
}) {
  if (!dueDate) return null;

  return (
    <div className={`flex items-center gap-1 text-[11px] leading-none ${overdue ? 'font-medium text-danger' : 'text-text-secondary'} ${className}`}>
      <Icon name="solar:calendar-linear" size={12} className="shrink-0" />
      <span>
        {overdue ? 'Overdue' : 'Due'} {formatShortDate(dueDate)}
        {extended && (
          <span className="ml-1 text-text-muted">(extended)</span>
        )}
      </span>
    </div>
  );
}
