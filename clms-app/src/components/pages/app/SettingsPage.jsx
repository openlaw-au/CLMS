import { useState } from 'react';
import Icon from '../../atoms/Icon';
import PageHeader from '../../molecules/PageHeader';
import { useAppContext } from '../../../context/AppContext';

const COMMON_SECTIONS = [
  { key: 'profile', label: 'Profile', icon: 'solar:user-circle-linear', desc: 'Name, email, and profile photo' },
  { key: 'notifications', label: 'Notifications', icon: 'solar:bell-linear', desc: 'Email and push notification preferences' },
  { key: 'display', label: 'Display', icon: 'solar:monitor-linear', desc: 'Theme, language, and accessibility' },
];

const CLERK_SECTIONS = [
  { key: 'loan-rules', label: 'Loan Rules', icon: 'solar:clipboard-check-linear', desc: 'Default loan duration, renewal limits' },
  { key: 'reminders', label: 'Reminders', icon: 'solar:alarm-linear', desc: 'Overdue reminder frequency and templates' },
];

const ADMIN_SECTIONS = [
  { key: 'jade', label: 'JADE Connection', icon: 'solar:link-round-linear', desc: 'API key and sync settings' },
  { key: 'koha', label: 'Koha ILS', icon: 'solar:server-linear', desc: 'Integrated Library System connection' },
  { key: 'billing', label: 'Billing', icon: 'solar:card-linear', desc: 'Subscription and payment details' },
  { key: 'audit', label: 'Audit Log', icon: 'solar:list-check-linear', desc: 'Activity history and compliance logs' },
  { key: 'sso', label: 'SSO', icon: 'solar:shield-keyhole-linear', desc: 'Single sign-on configuration' },
];

export default function SettingsPage() {
  const { role } = useAppContext();
  const [expanded, setExpanded] = useState(null);

  const isClerk = role === 'clerk';
  const sections = [
    ...COMMON_SECTIONS,
    ...(isClerk ? CLERK_SECTIONS : []),
    ...(isClerk ? ADMIN_SECTIONS : []),
  ];

  return (
    <div className="animate-page-in">
      <PageHeader title="Settings" subtitle="Account and application preferences." />

      <div className="mt-5 space-y-2">
        {sections.map((section) => (
          <article
            key={section.key}
            className="rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200"
          >
            <button
              type="button"
              onClick={() => setExpanded(expanded === section.key ? null : section.key)}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                  <Icon name={section.icon} size={18} className="text-text-secondary" />
                </span>
                <div>
                  <p className="text-sm font-medium text-text">{section.label}</p>
                  <p className="text-xs text-text-muted">{section.desc}</p>
                </div>
              </div>
              <Icon
                name={expanded === section.key ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'}
                size={16}
                className="text-text-muted"
              />
            </button>
            {expanded === section.key && (
              <div className="border-t border-border/40 px-4 py-4">
                <p className="text-sm text-text-muted">Configuration coming soon.</p>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
