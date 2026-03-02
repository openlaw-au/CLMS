import { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import WizardStep from '../organisms/WizardStep';
import Input from '../atoms/Input';
import LocationRow from '../molecules/LocationRow';
import CsvImportFlow from '../organisms/CsvImportFlow';
import WizardLink from '../molecules/WizardLink';
import DropZone from '../molecules/DropZone';
import InviteRow from '../molecules/InviteRow';

const totalSteps = 4;
const newInvite = () => ({ email: '', role: 'barrister' });

export default function WizardPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { onboarding, updateOnboarding } = useAppContext();

  const [importedCount, setImportedCount] = useState(0);
  const [inviteRows, setInviteRows] = useState([newInvite()]);
  const [sending, setSending] = useState(false);

  const paramStep = Number(params.step);
  const queryStep = Number(searchParams.get('step') || 1);
  const currentStep = Math.min(totalSteps, Math.max(1, Number.isNaN(paramStep) ? queryStep : paramStep));

  const moveStep = (nextStep) => {
    navigate(`/onboarding/clerk/step/${nextStep}`);
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

    // TODO(api): POST /api/invitations with inviteRows array, then navigate on success
    setSending(true);
    setTimeout(() => {
      setSending(false);
      navigate('/onboarding/clerk/setup');
    }, 600);
  };

  if (currentStep === 1) {
    return (
      <div className="app-shell-bg motion-slide flex min-h-screen items-center justify-center px-5 py-12">
        <WizardStep
          step={1}
          total={4}
          title="Name your chambers"
          disableNext={!isStep1Valid}
          onBack={onBack}
          onNext={onNext}
        >
          <div className="space-y-3">
            <Input
              icon="solar:buildings-2-linear"
              value={onboarding.chambersName}
              onChange={(event) => updateOnboarding({ chambersName: event.target.value })}
              placeholder="Chambers name"
            />
            <DropZone
              icon="solar:camera-linear"
              label="Upload chambers logo (optional)"
              accept="image/*"
              onFile={() => {}}
              compact
            />
          </div>
        </WizardStep>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div className="app-shell-bg motion-slide flex min-h-screen items-center justify-center px-5 py-12">
        <WizardStep
          step={2}
          total={4}
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

  const hasImported = importedCount > 0;

  if (currentStep === 3) {
    return (
      <div className="app-shell-bg motion-slide flex min-h-screen items-center justify-center px-5 py-12">
        <WizardStep
          step={3}
          total={4}
          title="Add your books"
          onBack={onBack}
          onNext={onNext}
          nextLabel={hasImported ? 'Continue' : 'Skip for now'}
        >
          <p className="text-sm text-text-secondary">
            You can always add more from the Catalogue later.
          </p>
          <div className="mt-4">
            <CsvImportFlow onImported={(count) => setImportedCount(count)} />
          </div>
          <WizardLink
            icon="solar:link-linear"
            label="Connect Koha ILS in Settings"
            className="mt-4"
          />
        </WizardStep>
      </div>
    );
  }

  const hasValidEmail = inviteRows.some((row) => row.email.trim());

  return (
    <div className="app-shell-bg motion-slide flex min-h-screen items-center justify-center px-5 py-12">
      <WizardStep
        step={4}
        total={4}
        title="Invite your team"
        onBack={onBack}
        onNext={onNext}
        nextLabel={hasValidEmail ? (sending ? 'Sending...' : 'Send Invites') : 'Skip for now'}
      >
        <p className="text-sm text-text-secondary">
          Add barristers and clerks. You can always invite more later.
        </p>
        <div className="mt-4 space-y-2">
          {inviteRows.map((row, index) => (
            <InviteRow
              key={`invite-${index}`}
              value={row}
              onChange={(next) =>
                setInviteRows((prev) => prev.map((r, i) => (i === index ? next : r)))
              }
              canRemove={inviteRows.length > 1}
              onRemove={() =>
                setInviteRows((prev) => prev.filter((_, i) => i !== index))
              }
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setInviteRows((prev) => [...prev, newInvite()])}
          className="mt-3 text-sm font-medium text-brand hover:text-brand-hover"
        >
          + Add another
        </button>
      </WizardStep>
    </div>
  );
}
