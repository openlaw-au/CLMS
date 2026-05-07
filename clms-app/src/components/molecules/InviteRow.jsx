import Input from '../atoms/Input';
import Select from '../atoms/Select';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';

export default function InviteRow({ value, onChange, onRemove, canRemove }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_160px_auto]">
      <Input
        type="email"
        placeholder="name@chambers.com"
        value={value.email}
        onChange={(event) => onChange({ ...value, email: event.target.value })}
      />
      <Select
        value={value.role}
        onChange={(event) => onChange({ ...value, role: event.target.value })}
      >
        <option value="barrister">Barrister</option>
        <option value="clerk">Clerk</option>
      </Select>
      {canRemove ? (
        <Button variant="danger" size="sm" className="rounded-xl" onClick={onRemove}>
          <Icon name="solar:trash-bin-minimalistic-linear" size={14} />
          Delete
        </Button>
      ) : <span />}
    </div>
  );
}
