import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import Icon from '../atoms/Icon';
import { useAppContext } from '../../context/AppContext';

export default function ForkChoice() {
  const navigate = useNavigate();
  const { updateOnboarding } = useAppContext();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <section className="mx-auto w-full max-w-4xl rounded-3xl border border-border bg-white p-6 shadow-soft sm:p-8">
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
              onClick={() => {
                if (!email) {
                  return;
                }

                setSent(true);
              }}
            >
              Send Invite
            </Button>
            {sent ? <p className="text-xs text-emerald-700">Invite sent. You can continue in solo mode anytime.</p> : null}
          </div>
        </article>

        <article className="rounded-2xl border border-border p-5">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-text">
            <Icon name="solar:document-text-linear" size={18} />
            <span>Start with Authority Lists</span>
          </p>
          <p className="mt-1 text-sm text-text-secondary">Use JADE search to build authority lists now. Connect chambers later.</p>
          <div className="mt-4">
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => {
                updateOnboarding({ mode: 'solo' });
                navigate('/app/lists?role=barrister&mode=solo');
              }}
            >
              Start with Authority Lists
            </Button>
          </div>
        </article>
      </div>
    </section>
  );
}
