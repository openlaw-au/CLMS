import PropTypes from 'prop-types';
import ContentLoader from '../atoms/ContentLoader';
import Icon from '../atoms/Icon';
import Skeleton from '../atoms/Skeleton';
import { getToneClasses } from './componentToneClasses';
import SectionCard from './SectionCard';

/** Props: { title, rows, loading? }. */
export default function SummaryCard({ loading = false, rows, title }) {
  return (
    <SectionCard as="article">
      <ContentLoader
        loading={loading}
        skeleton={
          <>
            <Skeleton className="h-5 w-28 rounded-lg" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: rows.length || 4 }, (_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-xl" />
                  <Skeleton className="h-4 flex-1 rounded" />
                  <Skeleton className="h-6 w-10 rounded" />
                </div>
              ))}
            </div>
          </>
        }
      >
        <header>
          <h2 className="text-sm font-semibold text-text">{title}</h2>
        </header>
        <ul className="mt-4 space-y-3">
          {rows.map((row) => {
            const toneClasses = getToneClasses(row.tone);

            return (
              <li key={row.label} className="flex items-center gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneClasses.swatch}`}>
                  <Icon name={row.icon} size={18} />
                </span>
                <div className="flex-1">
                  <p className="text-sm text-text-secondary">{row.label}</p>
                </div>
                <p className={`text-lg font-bold ${toneClasses.count}`}>{row.value}</p>
              </li>
            );
          })}
        </ul>
      </ContentLoader>
    </SectionCard>
  );
}

SummaryCard.propTypes = {
  loading: PropTypes.bool,
  rows: PropTypes.arrayOf(PropTypes.shape({
    icon: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    tone: PropTypes.oneOf(['amber', 'red', 'emerald', 'neutral', 'brand', 'info']).isRequired,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  })).isRequired,
  title: PropTypes.string.isRequired,
};
