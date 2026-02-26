import FeatureGrid from './FeatureGrid';
import { featureSets } from '../../mocks/landingContent';

export default {
  title: 'Organisms/FeatureGrid',
  component: FeatureGrid,
  decorators: [
    (StoryFn) => <div className="w-[1200px]">{StoryFn()}</div>,
  ],
  args: {
    primary: featureSets.barrister,
    secondary: featureSets.clerk,
  },
};

export const BarristerPrimary = {};

export const ClerkPrimary = {
  args: {
    primary: featureSets.clerk,
    secondary: featureSets.barrister,
  },
};
