import ReviewCard from './ReviewCard';
import { reviewCards } from '../../mocks/landingContent';

export default {
  title: 'Molecules/ReviewCard',
  component: ReviewCard,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div className="w-56">{Story()}</div>],
};

export const Brand = {
  args: { ...reviewCards.barrister[0] },
};

export const Blue = {
  args: { ...reviewCards.barrister[1] },
};

export const Green = {
  args: { ...reviewCards.clerk[0] },
};

export const Violet = {
  args: { ...reviewCards.clerk[1] },
};
