import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../atoms/Button';
import InviteRow from '../molecules/InviteRow';

const newInvite = () => ({ email: '', role: 'barrister' });

export default function InviteForm() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([newInvite()]);
  const [sending, setSending] = useState(false);

  const updateRow = (index, value) => {
    setRows((prev) => prev.map((row, rowIndex) => (rowIndex === index ? value : row)));
  };

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
  };

  const hasValidEmail = rows.some((row) => row.email.trim());

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
      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => navigate('/onboarding/clerk/step/3')}>
          &larr; Back
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/onboarding/clerk/setup')}>
            Skip
          </Button>
          <Button
            variant="primary"
            disabled={!hasValidEmail}
            className={!hasValidEmail ? 'opacity-40' : ''}
            loading={sending}
            onClick={() => {
              setSending(true);
              // TODO(api): POST /api/invitations with rows array, then navigate on success
              setTimeout(() => navigate('/onboarding/clerk/setup'), 600);
            }}
          >
            {sending ? 'Sending...' : 'Send Invites'}
          </Button>
        </div>
      </div>
    </section>
  );
}
