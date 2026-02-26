import Input from '../atoms/Input';
import Label from '../atoms/Label';

export default function FormField({ label, required = false, error, ...inputProps }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <Input {...inputProps} />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
