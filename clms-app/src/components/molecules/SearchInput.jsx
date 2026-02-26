import Input from '../atoms/Input';

export default function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <Input
      icon="solar:magnifer-linear"
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      autoComplete="off"
    />
  );
}
