import Tag from './Tag';

export default {
  title: 'Atoms/Tag',
  component: Tag,
  parameters: { layout: 'centered' },
  args: {
    label: 'Cross-examination',
  },
};

export const Default = {};

export const Removable = {
  args: {
    removable: true,
  },
};
