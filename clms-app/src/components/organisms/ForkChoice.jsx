import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import Icon from '../atoms/Icon';
import { useAppContext } from '../../context/AppContext';

function JadeLogo({ className = '' }) {
  return (
    <svg width="31" height="44" viewBox="0 0 31 44" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M0.00170833 23.7893C0.295255 23.7893 0.515414 23.8627 0.808961 23.8627C2.49685 24.0095 4.03968 24.5232 5.5808 25.257C8.44459 26.7248 10.5728 28.8547 12.0422 31.7185C12.8495 33.2596 13.2898 34.9492 13.4366 36.7105C13.51 37.1508 13.51 37.5911 13.51 38.0314V43.6856C13.51 43.8324 13.4366 43.8324 13.2898 43.8324C11.4534 43.6856 9.69216 43.2453 8.07595 42.4381C5.28555 41.0437 3.15733 38.9872 1.68789 36.2702C0.88064 34.8024 0.440321 33.2596 0.220161 31.6451C0.146775 31.2782 0.146775 30.9112 0.073388 30.5443V30.4709C1.35295e-06 28.1942 0 25.9926 0 23.7893H0.00170833Z" fill="currentColor"/>
      <path d="M30.3974 15.3465V29.7371C30.3974 32.821 29.4434 35.6848 27.5337 38.18C25.4037 40.9704 22.615 42.7316 19.2375 43.5406C18.5037 43.6874 17.8432 43.7608 17.1076 43.8342C17.0098 43.8342 16.9609 43.7852 16.9609 43.6874V14.1706C16.9609 10.4261 18.2818 7.12204 20.8521 4.40503C22.8352 2.34849 25.1836 1.02754 27.974 0.367056C28.7078 0.220282 29.5151 0.0735087 30.2507 0.00012207C30.3485 0.00012207 30.3974 0.0490466 30.3974 0.146896C30.3974 5.21228 30.3974 10.2794 30.3974 15.3448V15.3465Z" fill="currentColor"/>
    </svg>
  );
}

function NotFoundView({ onStartSolo, onContinueAfterInvite, startingSolo, sent, onSent }) {
  const [email, setEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  return (
    <>
      <h1 className="font-serif text-3xl text-text">{sent ? 'Invite Sent!' : 'No worries. Two ways to get started.'}</h1>
      {sent ? (
        <article className="mt-6 animate-fade-in rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <Icon name="solar:check-circle-bold" size={18} />
            {email}
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Your clerk will receive a link to set up your chambers library.
          </p>
          <div className="mt-4">
            <Button className="w-full" variant="secondary" onClick={() => onContinueAfterInvite(email)}>
              Start with JADE
            </Button>
          </div>
        </article>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="flex flex-col rounded-2xl border border-border p-5">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-text">
              <Icon name="solar:library-linear" size={18} />
              <span>Set up Your Library</span>
            </p>
            <p className="mt-1 text-sm text-text-secondary">Send an invite to your clerk. They'll add your chambers' collection to CLMS.</p>
            <div className="mt-auto space-y-3 pt-4">
              <Input
                type="email"
                icon={<Icon name="solar:letter-linear" size={18} className="text-brand" />}
                placeholder="clerk@chambers.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Button
                className={`w-full ${!email.trim() ? 'opacity-40' : ''}`}
                variant="primary"
                disabled={!email.trim()}
                loading={sendingInvite}
                onClick={() => {
                  setSendingInvite(true);
                  // TODO(api): POST /api/onboarding/invite-clerk { email }
                  setTimeout(() => {
                    setSendingInvite(false);
                    onSent();
                  }, 600);
                }}
              >
                {sendingInvite ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>
          </article>

          <div className="flex items-center justify-center md:hidden">
            <span className="text-sm text-text-tertiary">or</span>
          </div>

          <article className="flex flex-col rounded-2xl border border-border p-5">
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-text">
              <JadeLogo className="h-4 w-auto" />
              <span>Research Without Setup</span>
            </div>
            <p className="mt-1 text-sm text-text-secondary">Search cases and legislation, build authority lists. Connect your chambers library anytime.</p>
            <div className="mt-auto pt-4">
              <Button
                className="w-full"
                variant="secondary"
                loading={startingSolo}
                onClick={onStartSolo}
              >
                {startingSolo ? 'Loading...' : 'Start with Jade'}
              </Button>
            </div>
          </article>
        </div>
      )}
    </>
  );
}

export default function ForkChoice() {
  const navigate = useNavigate();
  const { updateOnboarding } = useAppContext();
  const [startingSolo, setStartingSolo] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <section className={`mx-auto w-full rounded-3xl border border-border bg-white p-6 shadow-soft sm:p-8 transition-all duration-500 ease-in-out ${sent ? 'max-w-lg' : 'max-w-4xl'}`}>
      <NotFoundView
        startingSolo={startingSolo}
        sent={sent}
        onSent={() => setSent(true)}
        onStartSolo={() => {
          setStartingSolo(true);
          updateOnboarding({ mode: 'solo' });
          // TODO(api): POST /api/onboarding/solo
          setTimeout(() => navigate('/app/dashboard?role=barrister&mode=solo'), 600);
        }}
        onContinueAfterInvite={(email) => {
          updateOnboarding({ clerkInviteEmail: email, mode: 'solo' });
          navigate('/app/dashboard?role=barrister&mode=solo');
        }}
      />
    </section>
  );
}
