import { useState } from 'react';
import PersonaToggle from './PersonaToggle';

export default {
  title: 'Atoms/PersonaToggle',
  component: PersonaToggle,
  parameters: { layout: 'centered' },
};

export function Default() {
  const [value, setValue] = useState('barrister');
  return <PersonaToggle value={value} onChange={setValue} />;
}

export function Compact() {
  const [value, setValue] = useState('clerk');
  return <PersonaToggle compact value={value} onChange={setValue} />;
}
