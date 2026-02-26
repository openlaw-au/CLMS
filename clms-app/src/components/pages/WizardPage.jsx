import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import WizardStep from '../organisms/WizardStep';
import Input from '../atoms/Input';
import Button from '../atoms/Button';
import LocationRow from '../molecules/LocationRow';
import Icon from '../atoms/Icon';

const totalSteps = 3;

export default function WizardPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { onboarding, updateOnboarding } = useAppContext();

  const paramStep = Number(params.step);
  const queryStep = Number(searchParams.get('step') || 1);
  const currentStep = Math.min(totalSteps, Math.max(1, Number.isNaN(paramStep) ? queryStep : paramStep));

  const moveStep = (nextStep) => {
    navigate(`/onboarding/clerk/step-${nextStep}`);
  };

  const isStep1Valid = Boolean(onboarding.chambersName?.trim());
  const validLocations = onboarding.locations.filter((item) => item.name.trim());
  const isStep2Valid = validLocations.length > 0;

  const addLocation = () => {
    updateOnboarding({
      locations: [...onboarding.locations, { name: '', floor: '' }],
    });
  };

  const updateLocation = (index, nextValue) => {
    updateOnboarding({
      locations: onboarding.locations.map((location, locationIndex) =>
        locationIndex === index ? nextValue : location,
      ),
    });
  };

  const removeLocation = (index) => {
    updateOnboarding({
      locations: onboarding.locations.filter((_, locationIndex) => locationIndex !== index),
    });
  };

  const onBack = () => {
    if (currentStep === 1) {
      navigate('/signup?role=clerk');
      return;
    }

    moveStep(currentStep - 1);
  };

  const onNext = () => {
    if (currentStep < totalSteps) {
      moveStep(currentStep + 1);
      return;
    }

    navigate('/onboarding/clerk/invite');
  };

  if (currentStep === 1) {
    return (
      <div className="app-shell-bg motion-slide min-h-screen px-5 py-12">
        <WizardStep
          step={1}
          total={3}
          title="Name your chambers"
          disableNext={!isStep1Valid}
          onBack={onBack}
          onNext={onNext}
        >
          <div className="space-y-3">
            <Input
              value={onboarding.chambersName}
              onChange={(event) => updateOnboarding({ chambersName: event.target.value })}
              placeholder="Chambers name"
            />
            <Input
              value={onboarding.chambersAddress}
              onChange={(event) => updateOnboarding({ chambersAddress: event.target.value })}
              placeholder="Address (optional)"
            />
            <div className="rounded-2xl border border-dashed border-border-strong bg-slate-50 p-4 text-sm text-text-secondary">
              <span className="inline-flex items-center gap-2">
                <Icon name="solar:camera-linear" size={18} />
                <span>Upload chambers logo (optional)</span>
              </span>
            </div>
          </div>
        </WizardStep>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div className="app-shell-bg motion-slide min-h-screen px-5 py-12">
        <WizardStep
          step={2}
          total={3}
          title="Add your library locations"
          disableNext={!isStep2Valid}
          onBack={onBack}
          onNext={onNext}
        >
          <div className="space-y-2">
            {onboarding.locations.map((location, index) => (
              <LocationRow
                key={`location-${index}`}
                value={location}
                onChange={(next) => updateLocation(index, next)}
                canRemove={onboarding.locations.length > 1}
                onRemove={() => removeLocation(index)}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={addLocation}
            className="mt-3 text-sm font-medium text-brand hover:text-brand-hover"
          >
            + Add location
          </button>
        </WizardStep>
      </div>
    );
  }

  return (
    <div className="app-shell-bg motion-slide min-h-screen px-5 py-12">
      <WizardStep
        step={3}
        total={3}
        title="Add your books"
        onBack={onBack}
        onNext={onNext}
        nextLabel="Finish Setup"
      >
        <div className="space-y-3">
          <div className="rounded-2xl border border-dashed border-border-strong bg-slate-50 p-6 text-sm text-text-secondary">
            <span className="inline-flex items-center gap-2">
              <Icon name="solar:folder-open-linear" size={18} />
              <span>Drop CSV here or click to browse</span>
            </span>
          </div>
          <div className="rounded-2xl border border-dashed border-border-strong bg-slate-50 p-6 text-sm text-text-secondary">
            <span className="inline-flex items-center gap-2">
              <Icon name="solar:camera-linear" size={18} />
              <span>Scan ISBN barcodes (mobile)</span>
            </span>
          </div>
          <div className="rounded-2xl border border-dashed border-border-strong bg-slate-50 p-6 text-sm text-text-secondary">
            <span className="inline-flex items-center gap-2">
              <Icon name="solar:link-linear" size={18} />
              <span>Connect Koha ILS</span>
            </span>
          </div>
        </div>
        <Button variant="ghost" className="mt-3 rounded-xl p-0" onClick={() => navigate('/onboarding/clerk/invite')}>
          Skip for now
        </Button>
      </WizardStep>
    </div>
  );
}
