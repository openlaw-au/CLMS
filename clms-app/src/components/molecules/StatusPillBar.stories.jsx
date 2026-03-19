import { useState } from 'react';
import StatusPillBar from './StatusPillBar';

export default {
  title: 'Molecules/StatusPillBar',
  component: StatusPillBar,
  parameters: { layout: 'padded' },
};

const defaultItems = [
  { key: 'all', label: 'All', count: 13, icon: 'solar:book-2-linear' },
  { key: 'available', label: 'Available', count: 9, icon: 'solar:check-circle-linear' },
  { key: 'on-loan', label: 'On Loan', count: 4, icon: 'solar:clock-circle-linear' },
];

const withOverdue = [
  ...defaultItems,
  { key: 'overdue', label: 'Overdue', count: 2, icon: 'solar:danger-triangle-linear', activeColor: 'bg-red-600' },
];

function Interactive({ items }) {
  const [value, setValue] = useState('all');
  return <StatusPillBar items={items} value={value} onChange={setValue} />;
}

export const Default = {
  render: () => <Interactive items={defaultItems} />,
};

export const WithOverdue = {
  render: () => <Interactive items={withOverdue} />,
};
