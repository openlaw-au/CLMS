import Input from '../atoms/Input';
import Button from '../atoms/Button';

export default function LocationRow({ value, onChange, onRemove, canRemove }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
      <Input
        placeholder="Location name"
        value={value.name}
        onChange={(event) => onChange({ ...value, name: event.target.value })}
      />
      <Input
        placeholder="Floor / Room"
        value={value.floor}
        onChange={(event) => onChange({ ...value, floor: event.target.value })}
      />
      <Button
        variant="ghost"
        className="rounded-xl"
        disabled={!canRemove}
        onClick={onRemove}
      >
        Delete
      </Button>
    </div>
  );
}
