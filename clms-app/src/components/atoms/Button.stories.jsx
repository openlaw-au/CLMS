import Button from './Button';

export default {
  title: 'Atoms/Button',
  component: Button,
  parameters: { layout: 'centered' },
  args: {
    children: 'Create Account',
    variant: 'primary',
  },
};

export const Primary = {};

export const Clerk = {
  args: {
    variant: 'clerk',
    children: 'Finish Setup',
  },
};

export const Secondary = {
  args: {
    variant: 'secondary',
    children: 'Skip',
  },
};

export const Ghost = {
  args: {
    variant: 'ghost',
    children: 'Cancel',
  },
};

export const Danger = {
  args: {
    variant: 'danger',
    children: 'Delete',
  },
};
