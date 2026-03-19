import { useEffect, useState } from 'react';
import Icon from '../../atoms/Icon';
import Input from '../../atoms/Input';
import Button from '../../atoms/Button';
import PageHeader from '../../molecules/PageHeader';
import Badge from '../../atoms/Badge';
import { useToast } from '../../../context/ToastContext';
import { getMembers, inviteMember } from '../../../services/membersService';

export default function ClerkMembersPage() {
  const { addToast } = useToast();
  const [members, setMembers] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('barrister');

  useEffect(() => {
    // TODO(api): Replace with GET /api/members — fetch all members
    getMembers().then(setMembers);
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    // TODO(api): Replace with POST /api/members/invite — send invite
    await inviteMember(inviteEmail, inviteRole);
    const updated = await getMembers();
    setMembers(updated);
    addToast({ message: `Invite sent to ${inviteEmail}`, type: 'success' });
    setInviteEmail('');
    setShowInvite(false);
  };

  const barristers = members.filter((m) => m.role === 'barrister');
  const clerks = members.filter((m) => m.role === 'clerk');

  return (
    <div>
      <PageHeader title="Members" subtitle="Manage chambers members and send invitations.">
        <Button size="sm" variant="primary" onClick={() => setShowInvite(!showInvite)}>
          <Icon name="solar:user-plus-linear" size={16} />
          Invite New Member
        </Button>
      </PageHeader>

      {/* Team summary bar */}
      <div className="mt-4 flex items-center gap-4 rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5">
        <span className="text-sm text-text-secondary">{members.length} members</span>
        <span className="text-xs text-text-muted">·</span>
        <span className="text-sm text-text-secondary">{barristers.length} barristers</span>
        <span className="text-xs text-text-muted">·</span>
        <span className="text-sm text-text-secondary">{clerks.length} clerks</span>
      </div>

      {showInvite && (
        <div className="mt-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <h3 className="mb-3 text-sm font-medium text-text">Invite New Member</h3>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="email@chambers.com.au"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="rounded-xl border border-border bg-white px-3 text-sm"
            >
              <option value="barrister">Barrister</option>
              <option value="clerk">Clerk</option>
            </select>
            <Button size="sm" variant="primary" onClick={handleInvite}>Send</Button>
          </div>
        </div>
      )}

      {/* Members table */}
      <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
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
            {members.map((m) => (
              <tr key={m.id} className="border-b border-border/30 transition-colors hover:bg-slate-50">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold ${
                      m.role === 'barrister' ? 'bg-brand/10 text-brand' : 'bg-slate-200 text-text'
                    }`}>
                      {m.initials}
                    </span>
                    <span className="font-medium text-text">{m.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <Badge variant="role">{m.role === 'barrister' ? 'Barrister' : 'Clerk'}</Badge>
                </td>
                <td className="px-5 py-3.5 text-text-secondary">{m.email}</td>
                <td className="px-5 py-3.5">
                  <Badge variant="status">Active</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
