import { useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import AppShell from '../organisms/AppShell';
import Input from '../atoms/Input';
import Button from '../atoms/Button';
import { useAppContext } from '../../context/AppContext';

export default function AppPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { role, setRole, onboarding } = useAppContext();

  const roleParam = searchParams.get('role');
  const mode = searchParams.get('mode') || onboarding.mode || 'joined';
  const section = params.section || (role === 'clerk' ? 'dashboard' : 'search');

  useEffect(() => {
    if (roleParam === 'barrister' || roleParam === 'clerk') {
      setRole(roleParam);
    }
  }, [roleParam, setRole]);

  const activeRole = roleParam === 'barrister' || roleParam === 'clerk' ? roleParam : role;

  const renderBarristerSearch = () => (
    <div>
      <h1 className="font-serif text-3xl text-text">Welcome, {onboarding.name || 'Counsel'}!</h1>
      <p className="mt-2 text-sm text-text-secondary">Search your chambers catalogue and JADE case law.</p>
      {mode === 'solo' ? (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-brand/30 bg-brand/10 p-3 text-sm text-brand">
          <span>Solo mode active. Join chambers to unlock shared library syncing.</span>
          <button
            type="button"
            onClick={() => navigate('/onboarding/barrister/lookup')}
            className="ml-3 shrink-0 rounded-full bg-brand px-3 py-1 text-xs font-medium text-white hover:bg-brand-hover"
          >
            Join Chambers
          </button>
        </div>
      ) : null}
      <div className="mt-5 max-w-xl">
        <Input autoFocus icon="solar:magnifer-linear" placeholder='Try: "Cross on Evidence"' />
      </div>
      <div className="mt-4 flex gap-2">
        <Button>Request Loan</Button>
        <Button variant="secondary">+ Authority List</Button>
      </div>
    </div>
  );

  const renderClerkDashboard = () => (
    <div>
      <h1 className="font-serif text-3xl text-text">Welcome, {onboarding.name || 'Clerk'}!</h1>
      <p className="mt-2 text-sm text-text-secondary">Your setup is complete. Next actions are available below.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          ['Overdue', '0'],
          ['Pending', '0'],
          ['Books', '847'],
        ].map(([label, count]) => (
          <article key={label} className="rounded-2xl border border-border bg-slate-50 p-4">
            <p className="text-2xl font-semibold text-text">{count}</p>
            <p className="text-sm text-text-secondary">{label}</p>
          </article>
        ))}
      </div>
      <div className="mt-5 space-y-2 text-sm text-text-secondary">
        <p>✓ {onboarding.locations.filter((item) => item.name.trim()).length || 0} locations synced</p>
        <p>✓ Invite workflow ready</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="clerk">Scan ISBN</Button>
        <Button variant="secondary">Import CSV</Button>
        <Button variant="secondary">Invite Members</Button>
      </div>
    </div>
  );

  return (
    <AppShell role={activeRole}>
      {activeRole === 'clerk' && section !== 'search' ? renderClerkDashboard() : renderBarristerSearch()}
    </AppShell>
  );
}
