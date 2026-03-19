import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../atoms/Icon';
import { useAppContext } from '../../context/AppContext';

const stepsByRole = {
  clerk: [
    { label: 'Creating your library...', icon: 'solar:library-linear' },
    { label: 'Importing catalogue...', icon: 'solar:book-2-linear' },
    { label: 'Setting up workspace...', icon: 'solar:widget-2-linear' },
  ],
  barrister: [
    { label: 'Connecting to chambers...', icon: 'solar:link-round-linear' },
    { label: 'Syncing library...', icon: 'solar:book-2-linear' },
    { label: 'Setting up workspace...', icon: 'solar:widget-2-linear' },
  ],
};

export default function SetupLoadingPage() {
  const navigate = useNavigate();
  const { onboarding, role } = useAppContext();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timers = [];

    timers.push(setTimeout(() => setCurrentStep(1), 1500));
    timers.push(setTimeout(() => setCurrentStep(2), 3000));
    timers.push(setTimeout(() => setCurrentStep(3), 4500));
    timers.push(
      setTimeout(() => {
        const dest = '/app/dashboard';
        navigate(`${dest}?role=${role}&mode=joined`, { replace: true });
      }, 5000),
    );

    return () => timers.forEach(clearTimeout);
  }, [navigate]);

  const steps = stepsByRole[role] || stepsByRole.barrister;
  const progress = Math.min((currentStep / steps.length) * 100, 100);

  return (
    <div className="app-shell-bg flex min-h-screen items-center justify-center px-5 py-12">
      <section className="mx-auto w-full max-w-md rounded-3xl border border-border bg-white p-8 shadow-soft">
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
            <Icon name="solar:buildings-linear" size={16} />
            {onboarding.chambersName || 'Chambers'}
          </span>
        </div>

        <div className="mt-8 space-y-4">
          {steps.map((step, idx) => {
            const done = currentStep > idx;
            const active = currentStep === idx;

            return (
              <div
                key={step.label}
                className={`flex items-center gap-3 transition-opacity duration-300 ${
                  active || done ? 'opacity-100' : 'opacity-30'
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
                    done
                      ? 'bg-emerald-100 text-emerald-600'
                      : active
                        ? 'bg-brand/10 text-brand'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {done ? (
                    <Icon name="solar:check-circle-bold" size={18} />
                  ) : (
                    <Icon name={step.icon} size={16} />
                  )}
                </span>
                <span
                  className={`text-sm font-medium ${
                    done ? 'text-emerald-700' : active ? 'text-text' : 'text-text-tertiary'
                  }`}
                >
                  {step.label}
                </span>
                {active && (
                  <span className="ml-auto h-4 w-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
