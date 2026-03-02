import { useState } from 'react';
import Button from '../atoms/Button';
import ProgressBar from '../atoms/ProgressBar';

export default function WizardStep({
  step,
  total,
  title,
  children,
  onBack,
  onNext,
  nextLabel = 'Continue',
  disableNext = false,
}) {
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onNext();
    }, 400);
  };
  return (
    <section className="mx-auto w-full max-w-2xl rounded-3xl border border-border bg-white p-6 shadow-soft sm:p-8">
      <ProgressBar current={step} total={total} />
      <h1 className="mt-4 font-serif text-3xl text-text">{title}</h1>
      <div className="mt-5">{children}</div>
      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="rounded-xl">
          Back
        </Button>
        <Button onClick={handleNext} disabled={disableNext} loading={loading} className={disableNext ? 'opacity-40' : ''}>
          {nextLabel}
        </Button>
      </div>
    </section>
  );
}
