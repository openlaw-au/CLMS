import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import Icon from '../../atoms/Icon';
import Input from '../../atoms/Input';
import Button from '../../atoms/Button';
import Badge from '../../atoms/Badge';
import { useAppContext } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import { getMembers, inviteMember } from '../../../services/membersService';
import { getBooks } from '../../../services/booksService';

function buildLocationGroups(locations, books) {
  const groups = {};

  locations.forEach((location) => {
    const building = location.name.includes('East')
      ? 'Owen Dixon East'
      : location.name.includes('West')
        ? 'Owen Dixon West'
        : location.name;
    if (!groups[building]) groups[building] = [];
    const bookCount = books.filter(
      (book) => book.location === location.name || (book.location === building && book.floor === location.floor),
    ).length;
    groups[building].push({ ...location, bookCount });
  });

  const bookLocations = [...new Set(books.map((book) => `${book.location}|${book.floor || ''}`))];
  bookLocations.forEach((entry) => {
    const [name, floor] = entry.split('|');
    if (!groups[name]) groups[name] = [];
    if (groups[name].some((location) => String(location.floor || '') === floor)) return;
    const bookCount = books.filter((book) => book.location === name && String(book.floor || '') === floor).length;
    groups[name].push({ name, floor, bookCount });
  });

  return groups;
}

export default function ClerkChambersPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { onboarding } = useAppContext();
  const { addToast } = useToast();

  const [members, setMembers] = useState([]);
  const [books, setBooks] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('barrister');
  const [expandedLoc, setExpandedLoc] = useState({});

  const routeTab = params.section === 'locations' ? 'locations' : params.section === 'members' ? 'members' : null;
  const queryTab = searchParams.get('tab') === 'locations' ? 'locations' : searchParams.get('tab') === 'members' ? 'members' : null;
  const initialTab = queryTab || routeTab || 'members';
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    // TODO(api): Replace with GET /api/members — fetch all chambers members
    getMembers().then(setMembers);
    // TODO(api): Replace with GET /api/books — fetch catalogue for location counts
    getBooks().then(setBooks);
  }, []);

  const barristers = members.filter((member) => member.role === 'barrister');
  const clerks = members.filter((member) => member.role === 'clerk');
  const configuredLocations = onboarding.locations.filter((location) => location.name.trim());
  const locationGroups = useMemo(
    () => buildLocationGroups(configuredLocations, books),
    [configuredLocations, books],
  );
  const locationCount = Object.values(locationGroups).reduce((acc, floors) => acc + floors.length, 0);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    // TODO(api): Replace with POST /api/members/invite — send invitation email
    await inviteMember(inviteEmail.trim(), inviteRole);
    const nextMembers = await getMembers();
    setMembers(nextMembers);
    addToast({ message: `Invite sent to ${inviteEmail.trim()}`, type: 'success' });
    setInviteEmail('');
  };

  const toggleExpand = (building) => {
    setExpandedLoc((prev) => ({ ...prev, [building]: !prev[building] }));
  };

  return (
    <div className="animate-page-in">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-text">Chambers</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage people and physical library locations in one place.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={tab === 'members' ? 'primary' : 'secondary'} onClick={() => setTab('members')}>
            <Icon name="solar:users-group-rounded-linear" size={14} />
            Members
          </Button>
          <Button size="sm" variant={tab === 'locations' ? 'primary' : 'secondary'} onClick={() => setTab('locations')}>
            <Icon name="solar:map-point-linear" size={14} />
            Locations
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          ['Barristers', barristers.length, 'solar:scale-linear', 'bg-brand/10', 'text-brand'],
          ['Clerks', clerks.length, 'solar:clipboard-list-linear', 'bg-slate-100', 'text-text-secondary'],
          ['Locations', locationCount, 'solar:map-point-linear', 'bg-blue-50', 'text-blue-600'],
        ].map(([label, value, icon, bg, color]) => (
          <article key={label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                <Icon name={icon} size={18} className={color} />
              </span>
              <p className="text-2xl font-semibold text-text">{value}</p>
            </div>
            <p className="mt-2 text-sm text-text-secondary">{label}</p>
          </article>
        ))}
      </div>

      {tab === 'members' ? (
        <div className="mt-5 space-y-4">
          <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <p className="text-sm font-medium text-text">Invite a member</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <div className="min-w-[240px] flex-1">
                <Input
                  icon="solar:letter-linear"
                  placeholder="email@chambers.com"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                />
              </div>
              <select
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value)}
                className="rounded-xl border border-border bg-white px-3 text-sm text-text"
              >
                <option value="barrister">Barrister</option>
                <option value="clerk">Clerk</option>
              </select>
              <Button size="sm" variant="primary" onClick={handleInvite}>
                <Icon name="solar:user-plus-linear" size={14} />
                Send Invite
              </Button>
            </div>
          </section>

          <section className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 text-xs text-text-secondary">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-border/30 transition-colors hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ring-1 ${
                          member.avatarColor
                            ? `${member.avatarColor.bg} ${member.avatarColor.text} ${member.avatarColor.ring}`
                            : member.role === 'barrister' ? 'bg-brand/10 text-brand ring-brand/20' : 'bg-slate-200 text-text ring-slate-300'
                        }`}>
                          {member.initials}
                        </span>
                        <span className="font-medium text-text">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant="role">{member.role === 'barrister' ? 'Barrister' : 'Clerk'}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-text-secondary">{member.email}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant="status">Active</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="mb-4 flex items-center gap-2">
            <Icon name="solar:buildings-linear" size={20} className="text-brand" />
            <h2 className="font-serif text-lg text-text">{onboarding.chambersName || 'Your Chambers'}</h2>
          </div>

          <div className="space-y-2">
            {Object.entries(locationGroups).map(([building, floors]) => (
              <div key={building} className="ml-2 border-l-2 border-slate-200 pl-4">
                <button
                  type="button"
                  onClick={() => toggleExpand(building)}
                  className="flex w-full items-center gap-2 rounded-lg py-2 text-left transition-colors hover:bg-slate-50"
                >
                  <Icon
                    name={expandedLoc[building] === false ? 'solar:alt-arrow-right-linear' : 'solar:alt-arrow-down-linear'}
                    size={14}
                    className="text-text-muted"
                  />
                  <Icon name="solar:map-point-linear" size={16} className="text-text-secondary" />
                  <span className="text-sm font-medium text-text">{building}</span>
                </button>

                {expandedLoc[building] !== false && (
                  <div className="ml-4 space-y-1 pb-2">
                    {floors.map((location, index) => (
                      <div key={`${building}-${location.floor}-${index}`} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                          <span className="text-sm text-text-secondary">Floor {location.floor || 'N/A'}</span>
                          <span className="text-xs text-text-muted">({location.bookCount || 0} books)</span>
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
                            title="Edit location"
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
          </div>

          {Object.keys(locationGroups).length === 0 && (
            <p className="mt-3 rounded-xl border border-dashed border-border p-3 text-sm text-text-muted">
              No locations configured yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
