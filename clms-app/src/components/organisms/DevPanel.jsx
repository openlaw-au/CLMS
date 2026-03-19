import { useState } from 'react';
import Icon from '../atoms/Icon';
import { useAppContext } from '../../context/AppContext';
import { useDevContext } from '../../context/DevContext';

export default function DevPanel() {
  const dev = useDevContext();
  const { role, setRole, onboarding, updateOnboarding } = useAppContext();
  const [open, setOpen] = useState(false);

  // Only show in dev mode
  if (!dev || !import.meta.env.DEV) return null;

  const handleToggleMock = () => {
    dev.setMockEmpty(!dev.mockEmpty);
    // Force reload to re-fetch all data
    window.location.reload();
  };

  const mockProfiles = {
    barrister: {
      name: 'James Chen',
      email: 'j.chen@chambers.com.au',
      chambersName: 'Owen Dixon Chambers',
      mode: 'joined',
      firstVisit: false,
      celebrationShown: true,
    },
    clerk: {
      name: 'Rebecca Torres',
      email: 'r.torres@chambers.com.au',
      chambersName: 'Owen Dixon Chambers',
      mode: 'joined',
      firstVisit: false,
      celebrationShown: true,
    },
  };

  const handleRoleSwitch = (newRole) => {
    setRole(newRole);
    updateOnboarding(mockProfiles[newRole]);
    window.location.reload();
  };

  const handleResetOnboarding = () => {
    updateOnboarding({
      name: '',
      email: '',
      chambersName: '',
      chambersFound: null,
      mode: 'joined',
      firstVisit: true,
      celebrationShown: false,
    });
    window.location.href = '/';
  };

  return (
    <>
      {/* Floating bubble */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        title="Dev Panel"
      >
        <Icon name="solar:code-square-linear" size={20} />
      </button>

      {/* Panel */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed bottom-20 right-5 z-50 w-72 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/10 animate-page-in">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text">Dev Panel</h3>
              <button type="button" onClick={() => setOpen(false)} className="rounded p-1 text-text-muted hover:bg-slate-100">
                <Icon name="solar:close-circle-linear" size={16} />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {/* Role */}
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">Role</p>
                <div className="mt-1.5 flex gap-1.5">
                  {['barrister', 'clerk'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleSwitch(r)}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-medium capitalize transition-colors ${
                        role === r
                          ? 'bg-brand text-white'
                          : 'bg-slate-100 text-text-secondary hover:bg-slate-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mock data */}
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">Mock Data</p>
                <div className="mt-1.5 flex gap-1.5">
                  {[
                    { label: 'Full', value: false },
                    { label: 'Empty', value: true },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => { if (dev.mockEmpty !== opt.value) handleToggleMock(); }}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                        dev.mockEmpty === opt.value
                          ? 'bg-brand text-white'
                          : 'bg-slate-100 text-text-secondary hover:bg-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Current state info */}
              <div className="rounded-lg bg-slate-50 p-2.5 text-[11px] text-text-muted">
                <p>User: {onboarding.name || '(none)'}</p>
                <p>Chambers: {onboarding.chambersName || '(none)'}</p>
                <p>Mode: {onboarding.mode}</p>
                <p>First visit: {onboarding.firstVisit ? 'yes' : 'no'}</p>
              </div>

              {/* Reset */}
              <button
                type="button"
                onClick={handleResetOnboarding}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <Icon name="solar:restart-linear" size={14} />
                Reset Onboarding
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
