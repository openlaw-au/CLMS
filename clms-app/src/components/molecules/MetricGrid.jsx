import PropTypes from 'prop-types';
import MetricCard from './MetricCard';

const METRIC_SLOTS = [0, 1, 2, 3];
const EMPTY_METRIC = {
  detail: '',
  icon: 'solar:book-2-linear',
  iconBg: 'neutral',
  label: '',
  value: '',
};

/** Props: { metrics, loading }. */
export default function MetricGrid({ metrics, loading }) {
  const metricCount = Array.isArray(metrics) ? metrics.length : 0;

  if (import.meta.env.DEV && metricCount !== 4) {
    throw new Error(`MetricGrid requires exactly 4 metrics. Received ${metricCount}.`);
  }

  return (
    <section aria-label="Dashboard metrics" className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {METRIC_SLOTS.map((index) => (
        <MetricCard
          key={index}
          loading={loading}
          {...(metrics[index] ?? EMPTY_METRIC)}
        />
      ))}
    </section>
  );
}

MetricGrid.propTypes = {
  loading: PropTypes.bool.isRequired,
  metrics: PropTypes.arrayOf(PropTypes.shape({
    detail: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    icon: PropTypes.string.isRequired,
    iconBg: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    to: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  })).isRequired,
};
