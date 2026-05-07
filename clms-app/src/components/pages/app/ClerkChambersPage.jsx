import { useEffect, useState } from 'react';
import Icon from '../../atoms/Icon';
import Input from '../../atoms/Input';
import Select from '../../atoms/Select';
import Button from '../../atoms/Button';
import Skeleton from '../../atoms/Skeleton';
import ContentLoader from '../../atoms/ContentLoader';
import PageHeader from '../../molecules/PageHeader';
import Badge from '../../atoms/Badge';
import { useToast } from '../../../context/ToastContext';
import { getMembers, inviteMember } from '../../../services/membersService';

export default function ClerkChambersPage() {
  const { addToast } = useToast();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('barrister');

  useEffect(() => {
    // TODO(api): Replace with GET /api/members — fetch all chambers members
    const min = new Promise((r) => setTimeout(r, 400));
    Promise.all([getMembers(), min]).then(([m]) => {
      setMembers(m);
      setLoading(false);
    });
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    // TODO(api): Replace with POST /api/members/invite — send invitation email
    await inviteMember(inviteEmail.trim(), inviteRole);
    const nextMembers = await getMembers();
    setMembers(nextMembers);
    addToast({ message: `Invite sent to ${inviteEmail.trim()}`, type: 'success' });
    setInviteEmail('');
  };

  return (
    <div className="animate-page-in">
      <ContentLoader
        loading={loading}
        skeleton={
          <div>
            <Skeleton className="h-7 w-32 rounded-lg" />
            <Skeleton className="mt-2 h-4 w-56 rounded" />
          </div>
        }
      >
        <PageHeader title="Chambers" subtitle="Manage people in your chambers." />
      </ContentLoader>

      <ContentLoader
        loading={loading}
        className="mt-5"
        skeleton={
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="mt-1.5 h-3 w-20 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        }
      >
        <div className="space-y-4">
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
              <Select
                size="md"
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value)}
              >
                <option value="barrister">Barrister</option>
                <option value="clerk">Clerk</option>
              </Select>
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
                  <tr key={member.id} className="border-b border-border/30">
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
      </ContentLoader>
    </div>
  );
}
