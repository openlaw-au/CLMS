import HeroMockup from './HeroMockup';

export default {
  title: 'Molecules/HeroMockup',
  component: HeroMockup,
  decorators: [
    (StoryFn) => <div className="w-[580px] p-10">{StoryFn()}</div>,
  ],
};

export const Barrister = {
  args: {
    role: 'barrister',
  },
};

export const Clerk = {
  args: {
    role: 'clerk',
  },
};
