import HeroMockup from './HeroMockup';
import { reviewCards } from '../../mocks/landingContent';

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
    reviews: reviewCards.barrister,
  },
};

export const Clerk = {
  args: {
    role: 'clerk',
    reviews: reviewCards.clerk,
  },
};
