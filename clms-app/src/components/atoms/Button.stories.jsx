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
    children: 'Import CSV',
  },
};

export const Approve = {
  args: {
    variant: 'approve',
    children: 'Approve',
  },
};

export const Recall = {
  args: {
    variant: 'recall',
    children: 'Request Recall',
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
      <Button variant="primary">Save</Button>
      <Button variant="secondary">Import CSV</Button>
      <Button variant="approve">Approve</Button>
      <Button variant="recall">Request Recall</Button>
      <Button variant="ghost">View Details</Button>
      <Button variant="danger">Delete</Button>
      <Button variant="danger-solid">Confirm Delete</Button>
    </div>
  ),
};
