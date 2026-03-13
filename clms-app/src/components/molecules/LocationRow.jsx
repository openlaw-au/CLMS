import Input from '../atoms/Input';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';

export default function LocationRow({ value, onChange, onRemove, canRemove }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
      <Input
        icon="solar:map-point-linear"
        placeholder="Location name"
        value={value.name}
        onChange={(event) => onChange({ ...value, name: event.target.value })}
      />
      <Input
        icon="solar:hashtag-linear"
        placeholder="Floor / Room"
        value={value.floor}
        onChange={(event) => onChange({ ...value, floor: event.target.value })}
      />
      {canRemove ? (
        <Button variant="ghost" size="sm" className="rounded-xl" onClick={onRemove}>
          <Icon name="solar:trash-bin-minimalistic-linear" size={14} />
          Delete
        </Button>
      ) : <span />}
    </div>
  );
}
