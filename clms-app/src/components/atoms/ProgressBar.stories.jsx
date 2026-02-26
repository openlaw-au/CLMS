import ProgressBar from './ProgressBar';

export default {
  title: 'Atoms/ProgressBar',
  component: ProgressBar,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div className="w-80">{Story()}</div>],
  args: {
    current: 2,
    total: 3,
  },
};

export const Default = {};

export const StepOne = {
  args: { current: 1, total: 3 },
};

export const Complete = {
  args: { current: 3, total: 3 },
};
