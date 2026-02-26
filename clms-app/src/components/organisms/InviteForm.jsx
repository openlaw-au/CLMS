import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../atoms/Button';
import InviteRow from '../molecules/InviteRow';

const newInvite = () => ({ email: '', role: 'barrister' });

export default function InviteForm() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([newInvite()]);

  const updateRow = (index, value) => {
    setRows((prev) => prev.map((row, rowIndex) => (rowIndex === index ? value : row)));
  };

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
  };

  return (
    <section className="mx-auto w-full max-w-2xl rounded-3xl border border-border bg-white p-6 shadow-soft sm:p-8">
      <h1 className="font-serif text-3xl text-text">Invite your barristers</h1>
      <div className="mt-5 space-y-2">
        {rows.map((row, index) => (
          <InviteRow
            key={`invite-${index}`}
            value={row}
            onChange={(next) => updateRow(index, next)}
            canRemove={rows.length > 1}
            onRemove={() => removeRow(index)}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => setRows((prev) => [...prev, newInvite()])}
        className="mt-4 text-sm font-medium text-brand hover:text-brand-hover"
      >
        + Add another
      </button>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => navigate('/app/dashboard?role=clerk')}>
          Skip
        </Button>
        <Button variant="clerk" onClick={() => navigate('/app/dashboard?role=clerk')}>
          Send Invites
        </Button>
      </div>
    </section>
  );
}
