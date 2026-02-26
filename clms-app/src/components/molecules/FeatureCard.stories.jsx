import FeatureCard from './FeatureCard';

export default {
  title: 'Molecules/FeatureCard',
  component: FeatureCard,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div className="w-96">{Story()}</div>],
  args: {
    icon: 'solar:magnifer-linear',
    title: 'One Search, Every Resource',
    description: 'CLMS connects physical catalogue and JADE in one place.',
    checks: ['Books and case law', 'Filter by location', 'JADE integration'],
  },
};

export const Default = {};

export const WithoutChecks = {
  args: {
    icon: 'solar:shield-user-linear',
    title: 'Built for Chambers',
    description: 'Role-based permissions enforce access by role.',
    checks: [],
  },
};
