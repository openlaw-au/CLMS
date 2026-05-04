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

export const DangerSolid = {
  args: {
    variant: 'danger-solid',
    children: 'Delete forever',
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
      <Button variant="secondary">Secondary — neutral slate fill</Button>
      <Button variant="ghost">Ghost — text only</Button>
      <Button variant="danger">Danger — soft destructive</Button>
      <Button variant="danger-solid">Danger Solid — use only for final-confirm step</Button>
    </div>
  ),
};
