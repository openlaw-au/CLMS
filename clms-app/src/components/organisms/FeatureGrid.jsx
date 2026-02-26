import Icon from '../atoms/Icon';
import FeatureCard from '../molecules/FeatureCard';

export default function FeatureGrid({ primary, secondary, swapping = false }) {
  return (
    <section id="features" className="relative z-10 mx-auto w-full max-w-7xl px-4 py-24 md:px-6">
      <div className="mx-auto mb-16 max-w-3xl text-center">
        <h2 className="mb-4 font-serif text-3xl font-medium tracking-tight text-text md:text-4xl">Built for Legal Professionals</h2>
        <p className="text-base text-slate-600">
          Six features designed around how barristers and clerks actually work, not how generic software thinks they should.
        </p>
      </div>

      <div id="features-group-primary" className={`features-group mb-12 ${swapping ? 'swapping' : ''}`} key={`primary-${primary.label}`}>
        <p className="features-subheader">
          <Icon name={primary.icon} size={14} className="shrink-0" />
          <span>{primary.label}</span>
        </p>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {primary.cards.map((card) => (
            <FeatureCard key={card.id} {...card} />
          ))}
        </div>
      </div>

      <div id="features-group-secondary" className={`features-group ${swapping ? 'swapping' : ''}`} key={`secondary-${secondary.label}`}>
        <p className="features-subheader">
          <Icon name={secondary.icon} size={14} className="shrink-0" />
          <span>{secondary.label}</span>
        </p>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {secondary.cards.map((card) => (
            <FeatureCard key={card.id} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}
