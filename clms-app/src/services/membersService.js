import { membersMock } from '../mocks/members';

const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

// TODO(api): Replace with GET /api/members — fetch all members in chambers
export async function getMembers() {
  await delay();
  return [...membersMock];
}

// TODO(api): Replace with POST /api/members/invite — send invite email to new member
export async function inviteMember(email, role) {
  await delay(400);
  const initials = email
    .split('@')[0]
    .split('.')
    .map((p) => p[0]?.toUpperCase())
    .join('');

  const newMember = {
    id: `m${Date.now()}`,
    name: email.split('@')[0].replace('.', ' '),
    email,
    role,
    initials: initials || '??',
    chambers: 'Owen Dixon Chambers',
  };
  membersMock.push(newMember);
  return newMember;
}
