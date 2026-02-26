import { MemoryRouter } from 'react-router-dom';
import CTASection from './CTASection';

export default {
  title: 'Organisms/CTASection',
  component: CTASection,
  decorators: [
    (StoryFn) => (
      <MemoryRouter>
        {StoryFn()}
      </MemoryRouter>
    ),
  ],
};

export const Barrister = {
  args: { role: 'barrister' },
};

export const Clerk = {
  args: { role: 'clerk' },
};
