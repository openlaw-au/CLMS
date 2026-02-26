import Badge from './Badge';

export default {
  title: 'Atoms/Badge',
  component: Badge,
  parameters: { layout: 'centered' },
  args: {
    children: 'Barrister',
  },
};

export const Default = {};

export const Role = {
  args: { variant: 'role', children: 'Clerk' },
};

export const Status = {
  args: { variant: 'status', children: 'Available' },
};

export const Info = {
  args: { variant: 'info', children: 'JADE' },
};
