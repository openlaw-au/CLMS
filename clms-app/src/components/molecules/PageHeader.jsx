/**
 * Shared page header — title, subtitle, and optional action buttons.
 * Used on all standard pages (not dashboard hero).
 */
export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="font-serif text-page-title text-text">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
