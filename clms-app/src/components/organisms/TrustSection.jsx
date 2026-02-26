import Icon from '../atoms/Icon';

export default function TrustSection({ cards }) {
  return (
    <section id="why-clms" className="relative z-10 w-full border-y border-slate-200 bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="mb-4 font-serif text-3xl font-medium tracking-tight text-text md:text-4xl">Why Chambers Trust CLMS</h2>
          <p className="text-base text-text-secondary">
            Built from the ground up for how Australian chambers actually operate, across locations, roles, and professional standards.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {cards.map((card) => (
            <article key={card.id} className="card">
              <div className="card-icon">
                <Icon name={card.icon} size={24} />
              </div>
              <h3 className="card-title">{card.title}</h3>
              <p className="card-desc mb-4">{card.description}</p>

              <div className="mt-auto flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-1 flex items-center gap-2">
                  <Icon name={card.metricIcon} size={20} className="shrink-0 text-text" />
                  <span className="relative -top-0.5 font-serif text-2xl font-semibold leading-none text-text">{card.metric}</span>
                </div>
                <p className="text-xs font-medium text-slate-500">{card.metricLabel}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
