import Label from './Label';

export default {
  title: 'Atoms/Label',
  component: Label,
  parameters: { layout: 'centered' },
  args: {
    children: 'Email',
  },
};

export const Default = {};

export const Required = {
  args: { children: 'Password', required: true },
};
