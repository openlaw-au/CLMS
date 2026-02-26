import Input from '../atoms/Input';
import Button from '../atoms/Button';

export default function InviteRow({ value, onChange, onRemove, canRemove }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_160px_auto]">
      <Input
        type="email"
        placeholder="name@chambers.com"
        value={value.email}
        onChange={(event) => onChange({ ...value, email: event.target.value })}
      />
      <select
        value={value.role}
        onChange={(event) => onChange({ ...value, role: event.target.value })}
        className="h-11 rounded-xl border border-border bg-white px-3 text-sm"
      >
        <option value="barrister">Barrister</option>
        <option value="clerk">Clerk</option>
      </select>
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
