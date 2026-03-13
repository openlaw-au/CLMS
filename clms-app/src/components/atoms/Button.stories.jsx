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

export const Secondary = {
  args: {
    variant: 'secondary',
    children: 'Skip for now',
  },
};

export const Tertiary = {
  args: {
    variant: 'tertiary',
    children: 'Look up',
  },
};

export const Outline = {
  args: {
    variant: 'outline',
    children: 'Consolidate',
  },
};

export const Ghost = {
  args: {
    variant: 'ghost',
    children: 'Cancel',
  },
};

export const Success = {
  args: {
    variant: 'success',
    children: 'Approve',
  },
};

export const Danger = {
  args: {
    variant: 'danger',
    children: 'Delete',
  },
};

export const Loading = {
  args: {
    loading: true,
    children: 'Saving...',
  },
};

export const Small = {
  args: {
    size: 'sm',
    children: 'Small',
  },
};

export const Large = {
  args: {
    size: 'lg',
    children: 'Large',
  },
};

export const Disabled = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
};

export const AllVariants = {
  render: () => (
    <div className="flex flex-col gap-3 items-start">
      <Button variant="primary">Primary — filled brand</Button>
      <Button variant="secondary">Secondary — bordered neutral</Button>
      <Button variant="tertiary">Tertiary — orange-50 fill</Button>
      <Button variant="outline">Outline — orange border</Button>
      <Button variant="ghost">Ghost — text only</Button>
      <Button variant="success">Success — emerald</Button>
      <Button variant="danger">Danger — red</Button>
    </div>
  ),
};
