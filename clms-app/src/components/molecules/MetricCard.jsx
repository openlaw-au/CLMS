import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import ContentLoader from '../atoms/ContentLoader';
import Icon from '../atoms/Icon';
import Skeleton from '../atoms/Skeleton';
import { getMetricIconClasses } from './componentToneClasses';

/** Props: { icon, iconBg, value, label, detail, to?, loading? }. */
export default function MetricCard({
  detail,
  icon,
  iconBg,
  label,
  loading = false,
  to,
  value,
}) {
  const navigate = useNavigate();
  const iconSwatchClasses = getMetricIconClasses(iconBg);
  const interactive = Boolean(to) && !loading;

  const handleNavigate = () => {
    if (to) {
      navigate(to);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleNavigate();
    }
  };

  return (
    <article
      className={`min-h-40 rounded-metric-card border border-metric bg-metric p-6 text-left backdrop-blur-xl ${loading ? 'shadow-metric-loading' : 'shadow-metric'} ${interactive ? 'bg-metric-hover cursor-pointer transition-[background-image,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30' : ''}`}
      onClick={interactive ? handleNavigate : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      <ContentLoader
        loading={loading}
        skeleton={
          <>
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-11 w-11 rounded-2xl" />
              <Skeleton className="h-8 w-12 rounded-lg" />
            </div>
            <Skeleton className="mt-4 h-3 w-20 rounded" />
            <Skeleton className="mt-2 h-3 w-28 rounded" />
          </>
        }
      >
        <header className="flex items-center justify-between gap-3">
          <span className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-metric-icon ${iconSwatchClasses}`}>
            <Icon name={icon} size={18} />
          </span>
          <p className="text-3xl font-bold leading-none tracking-tight text-slate-950">{value}</p>
        </header>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <p className="mt-1 text-sm text-slate-600">{detail}</p>
      </ContentLoader>
    </article>
  );
}

MetricCard.propTypes = {
  detail: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  icon: PropTypes.string.isRequired,
  iconBg: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  loading: PropTypes.bool,
  to: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
};
