import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import Icon from '../atoms/Icon';
import { useAppContext } from '../../context/AppContext';

function NotFoundView({ onStartSolo, startingSolo }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);

  return (
    <>
      <h1 className="font-serif text-3xl text-text">No worries. Two ways to get started.</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-border p-5">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-text">
            <Icon name="solar:letter-linear" size={18} />
            <span>Invite your clerk</span>
          </p>
          <p className="mt-1 text-sm text-text-secondary">Send an invite so your clerk can set up chambers.</p>
          <div className="mt-4 space-y-3">
            <Input
              type="email"
              placeholder="clerk@chambers.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Button
              className="w-full"
              loading={sendingInvite}
              onClick={() => {
                if (!email) {
                  return;
                }

                setSendingInvite(true);
                setTimeout(() => {
                  setSendingInvite(false);
                  setSent(true);
                }, 600);
              }}
            >
              {sendingInvite ? 'Sending...' : 'Send Invite'}
            </Button>
            {sent ? <p className="text-xs text-emerald-700">Invite sent. You can continue in solo mode anytime.</p> : null}
          </div>
        </article>

        <div className="flex items-center justify-center md:hidden">
          <span className="text-sm text-text-tertiary">or</span>
        </div>

        <article className="rounded-2xl border border-border p-5">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-text">
            <Icon name="solar:document-text-linear" size={18} />
            <span>Start solo (JADE only)</span>
          </p>
          <p className="mt-1 text-sm text-text-secondary">Use JADE search to build authority lists now. Connect chambers later.</p>
          <div className="mt-4">
            <Button
              className="w-full"
              variant="secondary"
              loading={startingSolo}
              onClick={onStartSolo}
            >
              {startingSolo ? 'Loading...' : 'Start solo'}
            </Button>
          </div>
        </article>
      </div>
    </>
  );
}

export default function ForkChoice() {
  const navigate = useNavigate();
  const { updateOnboarding } = useAppContext();
  const [startingSolo, setStartingSolo] = useState(false);

  return (
    <section className="mx-auto w-full max-w-4xl rounded-3xl border border-border bg-white p-6 shadow-soft sm:p-8">
      <NotFoundView
        startingSolo={startingSolo}
        onStartSolo={() => {
          setStartingSolo(true);
          updateOnboarding({ mode: 'solo' });
          // TODO(api): POST /api/onboarding/solo
          setTimeout(() => navigate('/app/search?role=barrister&mode=solo'), 600);
        }}
      />
    </section>
  );
}
