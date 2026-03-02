import { useState } from 'react';
import Button from '../atoms/Button';

export default function ChamberCard({ chamber, onSelect }) {
  const [loading, setLoading] = useState(false);

  const handleJoin = () => {
    setLoading(true);
    setTimeout(() => onSelect(chamber), 600);
  };

  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-text">{chamber.name}</h3>
          <p className="mt-1 text-xs text-text-tertiary">
            {chamber.members} members · {chamber.locations} locations
          </p>
        </div>
        <Button size="sm" onClick={handleJoin} loading={loading}>
          {loading ? 'Joining...' : 'Join'}
        </Button>
      </div>
    </div>
  );
}
