import { useState } from 'react';
import Icon from '../atoms/Icon';
import Button from '../atoms/Button';
import { useAppContext } from '../../context/AppContext';
import { useDevContext } from '../../context/DevContext';

const PANEL_CLOSE_MS = 200;

export default function DevPanel() {
  const dev = useDevContext();
  const { role, setRole, onboarding, updateOnboarding } = useAppContext();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

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

  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setOpen(false);
    }, PANEL_CLOSE_MS);
  };

  const togglePanel = () => {
    if (open) {
      requestClose();
      return;
    }

    setClosing(false);
    setOpen(true);
  };

  return (
    <>
      {/* Floating bubble */}
      <button
        type="button"
        onClick={togglePanel}
        className="fixed bottom-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-slate-800 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        title="Dev Panel"
      >
        <Icon name="solar:code-square-linear" size={20} />
      </button>

      {/* Panel */}
      {open && (
        <>
          <div
            className={`fixed inset-0 z-40 ${closing ? 'motion-fade-out' : 'motion-fade'}`}
            onClick={requestClose}
          />
          <div className={`fixed bottom-20 right-5 z-50 w-72 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/10 ${closing ? 'animate-page-out' : 'animate-page-in'}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text">Dev Panel</h3>
              <button
                type="button"
                onClick={requestClose}
                className="rounded-full p-1.5 text-text-muted transition-colors duration-150 hover:bg-slate-100 hover:text-text"
              >
                <Icon name="solar:close-linear" size={20} />
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
              <Button
                size="sm"
                variant="danger"
                onClick={handleResetOnboarding}
                className="w-full rounded-lg px-3 py-1.5 text-xs"
              >
                <Icon name="solar:restart-linear" size={14} />
                Reset Onboarding
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
