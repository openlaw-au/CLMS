import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from './Navbar';

export default {
  title: 'Organisms/Navbar',
  component: Navbar,
  decorators: [
    (StoryFn) => (
      <MemoryRouter>
        <div className="w-[1200px]">{StoryFn()}</div>
      </MemoryRouter>
    ),
  ],
};

export function Default() {
  const [role, setRole] = useState('barrister');
  return <Navbar role={role} onRoleChange={setRole} />;
}

export function WithRoleToggle() {
  const [role, setRole] = useState('barrister');
  return <Navbar role={role} onRoleChange={setRole} showNavRoleToggle activeSection="features" />;
}
