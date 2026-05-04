import { useState } from 'react';
import SegmentedTabs from './SegmentedTabs';

export default {
  title: 'Molecules/SegmentedTabs',
  component: SegmentedTabs,
  parameters: { layout: 'padded' },
};

const defaultItems = [
  { key: 'all', label: 'All Books', count: 24 },
  { key: 'available', label: 'Available', count: 18, tone: 'emerald' },
  { key: 'on-loan', label: 'On Loan', count: 6, tone: 'amber' },
];

const iconItems = [
  { key: 'all', label: 'All', count: 24, icon: 'solar:book-2-linear' },
  { key: 'available', label: 'Available', count: 18, icon: 'solar:check-circle-linear', tone: 'emerald' },
  { key: 'requested', label: 'Requested', count: 3, icon: 'solar:clock-circle-linear', tone: 'amber' },
  { key: 'saved', label: 'Saved', count: 5, icon: 'solar:book-bookmark-linear', tone: 'brand', badge: true },
];

const accentItems = [
  { key: 'all', label: 'All', count: 24, icon: 'solar:book-2-linear', activeAccent: 'brand' },
  { key: 'overdue', label: 'Overdue', count: 2, icon: 'solar:danger-triangle-linear', activeAccent: 'red', tone: 'red' },
  { key: 'review', label: 'Review', count: 4, icon: 'solar:hourglass-linear', activeAccent: 'amber', tone: 'amber' },
  { key: 'ready', label: 'Ready', count: 11, icon: 'solar:check-circle-linear', activeAccent: 'emerald', tone: 'emerald' },
];

function InteractiveRow({ initialValue, items }) {
  const [value, setValue] = useState(initialValue);

  return (
    <SegmentedTabs
      items={items}
      onChange={setValue}
      value={value}
    />
  );
}

function StoryRow({ children, title }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
        {title}
      </p>
      {children}
    </div>
  );
}

export const States = {
  render: () => (
    <div className="w-full max-w-4xl space-y-5">
      <StoryRow title="Default">
        <InteractiveRow
          items={defaultItems}
          initialValue="all"
        />
      </StoryRow>

      <StoryRow title="With Icons">
        <InteractiveRow
          items={iconItems}
          initialValue="available"
        />
      </StoryRow>

      <StoryRow title="Active Accent">
        <InteractiveRow
          items={accentItems}
          initialValue="all"
        />
      </StoryRow>
    </div>
  ),
};
