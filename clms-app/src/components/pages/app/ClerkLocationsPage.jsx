import { useEffect, useState } from 'react';
import Icon from '../../atoms/Icon';
import Button from '../../atoms/Button';
import PageHeader from '../../molecules/PageHeader';
import { useAppContext } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import { getBooks } from '../../../services/booksService';

export default function ClerkLocationsPage() {
  const { onboarding } = useAppContext();
  const { addToast } = useToast();
  const [books, setBooks] = useState([]);
  const [expandedLoc, setExpandedLoc] = useState({});

  useEffect(() => {
    getBooks().then(setBooks);
  }, []);

  const locations = onboarding.locations.filter((l) => l.name.trim());

  // Build tree structure from locations + books
  // Group by building, then by floor
  const buildingGroups = {};
  locations.forEach((loc) => {
    const building = loc.name.includes('East') ? 'Owen Dixon East' : loc.name.includes('West') ? 'Owen Dixon West' : loc.name;
    if (!buildingGroups[building]) buildingGroups[building] = [];
    const bookCount = books.filter((b) => b.location === loc.name || (b.location === building && b.floor === loc.floor)).length;
    buildingGroups[building].push({ ...loc, bookCount });
  });

  // Also add locations from books that might not be in onboarding
  const bookLocations = [...new Set(books.map((b) => `${b.location}|${b.floor}`))];
  bookLocations.forEach((key) => {
    const [loc, floor] = key.split('|');
    const building = loc;
    if (!buildingGroups[building]) buildingGroups[building] = [];
    const exists = buildingGroups[building].some((l) => l.floor === floor);
    if (!exists) {
      const bookCount = books.filter((b) => b.location === loc && b.floor === floor).length;
      buildingGroups[building].push({ name: loc, floor, bookCount });
    }
  });

  const toggleExpand = (building) => {
    setExpandedLoc((prev) => ({ ...prev, [building]: !prev[building] }));
  };

  return (
    <div>
      <PageHeader title="Locations" subtitle="Manage your chambers library locations.">
        <Button size="sm" variant="primary" onClick={() => addToast({ message: 'Location editor coming soon', type: 'info' })}>
          <Icon name="solar:add-circle-linear" size={16} />
          Add Location
        </Button>
      </PageHeader>

      {/* Location tree */}
      <div className="mt-5 space-y-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="solar:buildings-linear" size={20} className="text-brand" />
            <h2 className="font-serif text-card-title text-text">{onboarding.chambersName || 'Owen Dixon Chambers'}</h2>
          </div>

          {Object.entries(buildingGroups).map(([building, floors]) => (
            <div key={building} className="ml-2 border-l-2 border-slate-200 pl-4">
              <button
                type="button"
                onClick={() => toggleExpand(building)}
                className="flex w-full items-center gap-2 rounded-lg py-2 text-left transition-colors hover:bg-slate-50"
              >
                <Icon
                  name={expandedLoc[building] ? 'solar:alt-arrow-down-linear' : 'solar:alt-arrow-right-linear'}
                  size={14}
                  className="text-text-muted"
                />
                <Icon name="solar:map-point-linear" size={16} className="text-text-secondary" />
                <span className="text-sm font-medium text-text">{building}</span>
              </button>

              {(expandedLoc[building] !== false) && (
                <div className="ml-4 space-y-1 pb-2">
                  {floors.map((loc, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                        <span className="text-sm text-text-secondary">
                          Floor {loc.floor || 'N/A'}
                        </span>
                        <span className="text-xs text-text-muted">({loc.bookCount || 0} books)</span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => addToast({ message: 'QR code generated', type: 'info' })}
                          className="rounded p-1 text-text-muted transition-colors hover:bg-slate-200 hover:text-text"
                          title="Generate QR"
                        >
                          <Icon name="solar:qr-code-linear" size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => addToast({ message: 'Location editor coming soon', type: 'info' })}
                          className="rounded p-1 text-text-muted transition-colors hover:bg-slate-200 hover:text-text"
                          title="Edit"
                        >
                          <Icon name="solar:pen-linear" size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {Object.keys(buildingGroups).length === 0 && locations.length === 0 && (
            <p className="text-sm text-text-muted">No locations configured. Add locations to organize your library.</p>
          )}
        </div>
      </div>
    </div>
  );
}
