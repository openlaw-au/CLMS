import { useState } from 'react';
import SearchInput from './SearchInput';

export default {
  title: 'Molecules/SearchInput',
  component: SearchInput,
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div className="w-80">{Story()}</div>],
};

export function Default() {
  const [value, setValue] = useState('');
  return <SearchInput value={value} onChange={setValue} placeholder="Search for chambers..." />;
}
