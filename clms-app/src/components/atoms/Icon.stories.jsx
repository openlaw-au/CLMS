import Icon from './Icon';

export default {
  title: 'Atoms/Icon',
  component: Icon,
  parameters: { layout: 'centered' },
  args: {
    name: 'solar:magnifer-linear',
    size: 24,
  },
};

export const Default = {};

export const Large = {
  args: { name: 'solar:book-2-linear', size: 48 },
};

export const BrandColor = {
  args: { name: 'solar:shield-check-linear', size: 32, className: 'text-brand' },
};
