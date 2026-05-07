import { useEffect, useRef, useState } from 'react';
import Icon from '../../atoms/Icon';
import PageHeader from '../../molecules/PageHeader';
import { useAppContext } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';

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

const LOAN_DAY_OPTIONS = [7, 14, 21];
const REMINDER_DAY_OPTIONS = [1, 3, 7];

function formatReminderTiming(days) {
  return `${days} ${days === 1 ? 'day' : 'days'} before due`;
}

function SettingsOption({ checked, helper, label, name, onChange, type = 'radio', value }) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all duration-200 ${
        checked ? 'border-brand/30 bg-brand/5' : 'border-border/70 bg-slate-50/60 hover:bg-slate-50'
      }`}
    >
      <input
        type={type}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 rounded border-border accent-brand"
      />
      <span>
        <span className="block text-sm font-medium text-text">{label}</span>
        {helper && <span className="mt-1 block text-xs text-text-muted">{helper}</span>}
      </span>
    </label>
  );
}

export default function SettingsPage() {
  const { addToast } = useToast();
  const { role, chambersSettings, updateChambersSettings } = useAppContext();
  const [expanded, setExpanded] = useState(null);
  const saveToastTimerRef = useRef(null);

  const isClerk = role === 'clerk';
  const sections = [
    ...COMMON_SECTIONS,
    ...(isClerk ? CLERK_SECTIONS : []),
    ...(isClerk ? ADMIN_SECTIONS : []),
  ];
  const defaultLoanDays = chambersSettings?.defaultLoanDays ?? 14;
  const reminderDaysBefore = chambersSettings?.reminderDaysBefore ?? 3;
  const includeLocationInReminders = chambersSettings?.includeLocationInReminders ?? true;
  const reminderPreview = `Your loan of 'Cross on Evidence' is due on 28 Mar.${
    includeLocationInReminders ? ' Please return to the chambers library.' : ''
  }`;

  useEffect(() => () => {
    if (saveToastTimerRef.current) {
      clearTimeout(saveToastTimerRef.current);
    }
  }, []);

  const queueSavedToast = () => {
    if (saveToastTimerRef.current) {
      clearTimeout(saveToastTimerRef.current);
    }

    saveToastTimerRef.current = setTimeout(() => {
      addToast({ message: 'Settings saved', type: 'success' });
      saveToastTimerRef.current = null;
    }, 250);
  };

  const handleSettingsChange = (patch) => {
    updateChambersSettings(patch);
    queueSavedToast();
  };

  const renderSectionContent = (sectionKey) => {
    if (sectionKey === 'loan-rules') {
      return (
        <div className="motion-fade space-y-3">
          <div role="radiogroup" aria-label="Default loan period" className="space-y-2">
            {LOAN_DAY_OPTIONS.map((days) => (
              <SettingsOption
                key={days}
                type="radio"
                name="default-loan-days"
                value={days}
                checked={defaultLoanDays === days}
                onChange={() => handleSettingsChange({ defaultLoanDays: days })}
                label={`${days} days`}
                helper="New loans default to this period"
              />
            ))}
          </div>
        </div>
      );
    }

    if (sectionKey === 'reminders') {
      return (
        <div className="motion-fade space-y-4">
          <div>
            <p className="text-sm font-medium text-text">Reminder timing</p>
            <div role="radiogroup" aria-label="Reminder timing" className="mt-3 space-y-2">
              {REMINDER_DAY_OPTIONS.map((days) => (
                <SettingsOption
                  key={days}
                  type="radio"
                  name="reminder-days-before"
                  value={days}
                  checked={reminderDaysBefore === days}
                  onChange={() => handleSettingsChange({ reminderDaysBefore: days })}
                  label={formatReminderTiming(days)}
                />
              ))}
            </div>
          </div>

          <SettingsOption
            type="checkbox"
            name="include-location-in-reminders"
            checked={includeLocationInReminders}
            onChange={(event) => handleSettingsChange({ includeLocationInReminders: event.target.checked })}
            label="Include return guidance in reminder"
          />

          <div className="rounded-xl border border-border/70 bg-slate-50/60 p-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-text-muted">Preview</p>
            <p className="mt-2 text-xs italic text-text-secondary">"{reminderPreview}"</p>
          </div>
        </div>
      );
    }

    return <p className="text-sm text-text-muted">Configuration coming soon.</p>;
  };

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
                {renderSectionContent(section.key)}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
