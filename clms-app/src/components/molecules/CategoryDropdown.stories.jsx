import { useState } from 'react';
import CategoryDropdown from './CategoryDropdown';

export default {
  title: 'Molecules/CategoryDropdown',
  component: CategoryDropdown,
  parameters: { layout: 'centered' },
};

const options = [
  { label: 'Evidence', count: 3 },
  { label: 'Contract', count: 2 },
  { label: 'Equity', count: 2 },
  { label: 'Tort', count: 1 },
  { label: 'Public Law', count: 1 },
];

function Interactive() {
  const [selected, setSelected] = useState(new Set());
  const toggle = (label) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  };
  return (
    <CategoryDropdown
      options={options}
      selected={selected}
      onToggle={toggle}
      onClear={() => setSelected(new Set())}
    />
  );
}

export const Default = {
  render: () => <Interactive />,
};
