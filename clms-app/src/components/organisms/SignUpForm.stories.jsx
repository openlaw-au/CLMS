import SignUpForm from './SignUpForm';

export default {
  title: 'Organisms/SignUpForm',
  component: SignUpForm,
  parameters: { layout: 'centered' },
  args: {
    initialRole: 'barrister',
    onSubmit: () => {},
  },
};

export const Barrister = {};

export const Clerk = {
  args: { initialRole: 'clerk' },
};
