import Icon from '../atoms/Icon';

export default function FeatureCard({ icon, title, description, checks = [] }) {
  return (
    <article className="card">
      <div className="card-icon">
        <Icon name={icon} size={24} />
      </div>
      <h3 className="card-title">{title}</h3>
      <p className="card-desc">{description}</p>
      {checks.length ? (
        <ul className="card-checks">
          {checks.map((item) => (
            <li key={item} className="card-check">
              <Icon name="solar:check-circle-linear" size={16} className="shrink-0 text-emerald-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
