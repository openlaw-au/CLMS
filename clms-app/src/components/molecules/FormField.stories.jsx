import FormField from './FormField';

export default {
  title: 'Molecules/FormField',
  component: FormField,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div className="w-80">{Story()}</div>],
  args: {
    label: 'Email',
    placeholder: 'james@chambers.com',
    type: 'email',
  },
};

export const Default = {};

export const Required = {
  args: { label: 'Password', required: true, type: 'password', placeholder: '••••••••' },
};

export const WithError = {
  args: { label: 'Email', required: true, error: 'Please enter a valid email address' },
};
