import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import HeroSection from './HeroSection';

export default {
  title: 'Organisms/HeroSection',
  component: HeroSection,
  decorators: [
    (StoryFn) => (
      <MemoryRouter>
        <div className="w-[1200px]">{StoryFn()}</div>
      </MemoryRouter>
    ),
  ],
};

export function Barrister() {
  const [role, setRole] = useState('barrister');
  return <HeroSection role={role} onRoleChange={setRole} />;
}

export function Clerk() {
  const [role, setRole] = useState('clerk');
  return <HeroSection role={role} onRoleChange={setRole} />;
}
