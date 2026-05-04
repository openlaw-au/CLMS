import PropTypes from 'prop-types';
import ContentLoader from '../atoms/ContentLoader';
import Skeleton from '../atoms/Skeleton';

/** Props: { greeting, subtitle, loading? }. */
export default function DashboardHero({ greeting, loading = false, subtitle }) {
  return (
    <section className="relative flex min-h-[240px] flex-col justify-center rounded-b-hero px-1 pb-24 pt-16 text-white md:min-h-[260px] md:px-0 md:pb-28 md:pt-20">
      <ContentLoader
        loading={loading}
        skeleton={
          <>
            <Skeleton dark className="h-10 w-48 rounded-lg md:w-56" />
            <Skeleton dark className="mt-3 h-6 w-72 rounded-lg md:w-96" />
          </>
        }
      >
        <>
          <h1 className="font-serif text-4xl leading-none tracking-tight md:text-5xl">{greeting}</h1>
          <p className="mt-3 font-serif text-xl leading-tight text-hero-subtitle md:text-2xl">{subtitle}</p>
        </>
      </ContentLoader>
    </section>
  );
}

DashboardHero.propTypes = {
  greeting: PropTypes.string.isRequired,
  loading: PropTypes.bool,
  subtitle: PropTypes.string.isRequired,
};
