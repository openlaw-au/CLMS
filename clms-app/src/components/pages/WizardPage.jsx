import { useRef, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import WizardStep from '../organisms/WizardStep';
import Icon from '../atoms/Icon';
import Input from '../atoms/Input';
import LocationRow from '../molecules/LocationRow';
import CsvImportFlow from '../organisms/CsvImportFlow';
import IsbnLookupFlow from '../organisms/IsbnLookupFlow';
import WizardLink from '../molecules/WizardLink';
import DropZone from '../molecules/DropZone';
import InviteRow from '../molecules/InviteRow';
import ImageCropModal from '../molecules/ImageCropModal';

const totalSteps = 4;
const newInvite = () => ({ email: '', role: 'barrister' });

export default function WizardPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { onboarding, updateOnboarding } = useAppContext();

  const [importedCount, setImportedCount] = useState(0);
  const [csvPhase, setCsvPhase] = useState('idle');
  const csvRef = useRef(null);
  const [activeTab, setActiveTab] = useState('csv');  // 'csv' | 'scan' | 'paste'
  const [isbnBooks, setIsbnBooks] = useState([]);
  const [isbnPhase, setIsbnPhase] = useState('idle');
  const [inviteRows, setInviteRows] = useState([newInvite()]);
  const [sending, setSending] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropConfirm = (croppedDataUrl) => {
    updateOnboarding({ chambersLogo: croppedDataUrl });
    setCropSrc(null);
  };

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

    // If invites already sent, "Continue" navigates to setup
    if (inviteSent) {
      navigate('/onboarding/clerk/setup');
      return;
    }

    // Persist valid invites to context before sending
    const validInvites = inviteRows.filter((row) => row.email.trim());
    if (validInvites.length > 0) {
      updateOnboarding({ invites: validInvites });
    }

    // No emails → skip straight to setup
    if (validInvites.length === 0) {
      navigate('/onboarding/clerk/setup');
      return;
    }

    // TODO(api): POST /api/invitations with inviteRows array, then show confirmation on success
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setInviteSent(true);
    }, 600);
  };

  if (currentStep === 1) {
    const hasLogo = Boolean(onboarding.chambersLogo);

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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          <Input
            icon="solar:buildings-2-linear"
            value={onboarding.chambersName}
            onChange={(event) => updateOnboarding({ chambersName: event.target.value })}
            placeholder="Chambers name"
          />

          {hasLogo ? (
            <div className="mt-3 flex items-center gap-3">
              <img
                src={onboarding.chambersLogo}
                alt="Chambers logo"
                className="h-10 w-10 rounded-full object-cover ring-2 ring-border"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm font-medium text-brand hover:text-brand-hover"
              >
                Change logo
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-hover"
            >
              <Icon name="solar:camera-linear" size={14} />
              Upload logo (optional)
            </button>
          )}
        </WizardStep>

        {cropSrc && (
          <ImageCropModal
            imageSrc={cropSrc}
            onConfirm={handleCropConfirm}
            onCancel={() => setCropSrc(null)}
          />
        )}
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

  // Step 3 button logic — varies by active tab
  const step3Tabs = [
    { id: 'csv', label: 'Import CSV', icon: 'solar:folder-open-linear' },
    { id: 'scan', label: 'Scan ISBN', icon: 'solar:scanner-linear' },
    { id: 'paste', label: 'Paste ISBNs', icon: 'solar:clipboard-text-linear' },
  ];

  // CSV tab button logic
  const csvHideNext = csvPhase === 'uploading' || csvPhase === 'collapsing';
  const csvNextLabel =
    csvPhase === 'done' ? 'Continue' :
    csvPhase === 'mapping' ? `Import ${csvRef.current?.importCount ?? 247} books` :
    'Skip for now';
  const csvOnNext = csvPhase === 'mapping'
    ? () => csvRef.current?.doImport()
    : onNext;

  // ISBN tab button logic — always show the button so users can proceed anytime
  const isbnHideNext = false;
  const isbnNextLabel = isbnBooks.length > 0 ? 'Continue' : 'Skip for now';

  // Resolved step 3 button props based on active tab
  const s3HideNext = activeTab === 'csv' ? csvHideNext : isbnHideNext;
  const s3NextLabel = activeTab === 'csv' ? csvNextLabel : isbnNextLabel;
  const s3OnNext = activeTab === 'csv' ? csvOnNext : onNext;

  const handleAddIsbnBooks = (newBooks, replace = false) => {
    if (replace) {
      // Used by consolidate — replace entire list
      setIsbnBooks(newBooks);
      setImportedCount(newBooks.length);
    } else {
      setIsbnBooks((prev) => [...prev, ...newBooks]);
      setImportedCount((prev) => prev + newBooks.length);
    }
  };

  const handleRemoveIsbnBook = (index) => {
    setIsbnBooks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditIsbnBook = (index, updated) => {
    setIsbnBooks((prev) => prev.map((book, i) => (i === index ? { ...book, ...updated } : book)));
  };

  if (currentStep === 3) {
    return (
      <div className="app-shell-bg motion-slide flex min-h-screen items-center justify-center px-5 py-12">
        <WizardStep
          step={3}
          total={4}
          title="Add your first books"
          onBack={onBack}
          onNext={s3OnNext}
          nextLabel={s3NextLabel}
          hideNext={s3HideNext}
        >
          <p className="text-sm text-text-secondary">
            Start with one shelf. You can always add more later.
          </p>

          {/* Tab bar */}
          <div className="mt-4 flex gap-2">
            {step3Tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-brand text-white'
                    : 'bg-slate-100 text-text-secondary hover:bg-slate-200'
                }`}
              >
                <Icon name={tab.icon} size={15} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="mt-4">
            {activeTab === 'csv' && (
              <CsvImportFlow
                ref={csvRef}
                onImported={(count) => {
                  setImportedCount(count);
                  updateOnboarding({ importedCount: count });
                }}
                onPhaseChange={setCsvPhase}
              />
            )}
            {(activeTab === 'scan' || activeTab === 'paste') && (
              <IsbnLookupFlow
                mode={activeTab}
                addedBooks={isbnBooks}
                onAddBooks={handleAddIsbnBooks}
                onRemoveBook={handleRemoveIsbnBook}
                onEditBook={handleEditIsbnBook}
                onPhaseChange={setIsbnPhase}
              />
            )}
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
  const sentEmails = inviteRows.filter((row) => row.email.trim());

  return (
    <div className="app-shell-bg motion-slide flex min-h-screen items-center justify-center px-5 py-12">
      <WizardStep
        step={4}
        total={4}
        title={inviteSent ? 'Invites sent!' : 'Invite a few colleagues'}
        onBack={inviteSent ? undefined : onBack}
        onNext={onNext}
        hideNext={sending}
        hideBack={inviteSent}
        nextLabel={inviteSent ? 'Continue' : hasValidEmail ? (sending ? 'Sending...' : 'Send Invites') : 'Skip for now'}
      >
        {inviteSent ? (
          <div className="space-y-2 motion-fade">
            {sentEmails.map((row) => (
              <div
                key={row.email}
                className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
              >
                <Icon name="solar:check-circle-bold" size={18} className="shrink-0 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-emerald-800">{row.email}</p>
                  <p className="text-xs text-emerald-600 capitalize">{row.role}</p>
                </div>
              </div>
            ))}
            <p className="pt-1 text-sm text-text-secondary">
              They'll receive a link to join your chambers library.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-text-secondary">
              {importedCount > 0
                ? 'Books added. Invite a few colleagues to start borrowing.'
                : 'Add a few team members to start. You can always invite more later.'}
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
          </>
        )}
      </WizardStep>
    </div>
  );
}
