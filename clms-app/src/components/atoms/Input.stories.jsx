import Input from './Input';

export default {
  title: 'Atoms/Input',
  component: Input,
  parameters: { layout: 'centered' },
  args: {
    placeholder: 'name@chambers.com',
  },
  decorators: [(Story) => <div className="w-80">{Story()}</div>],
};

export const Default = {};
export const WithIcon = {
  args: {
    icon: 'solar:magnifer-linear',
    placeholder: 'Search for chambers',
  },
};
