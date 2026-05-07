import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import SignUpForm from '../organisms/SignUpForm';
import AuthSplitLayout from '../templates/AuthSplitLayout';

export default function SignUpPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { role, setRole, updateOnboarding } = useAppContext();

  const queryRole = searchParams.get('role');
  const initialRole = queryRole === 'clerk' ? 'clerk' : queryRole === 'barrister' ? 'barrister' : role;
  const [selectedRole, setSelectedRole] = useState(initialRole);

  useEffect(() => {
    setRole(selectedRole);
  }, [selectedRole, setRole]);

  const handleRoleChange = (nextRole) => {
    setSelectedRole(nextRole);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('role', nextRole);
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <AuthSplitLayout role={selectedRole} mode="signup">
      <SignUpForm
        role={selectedRole}
        onRoleChange={handleRoleChange}
        onSubmit={(form) => {
          setRole(form.role);
          updateOnboarding({
            name: form.name,
            email: form.email,
            password: form.password,
            chambersName: '',
            chambersAddress: '',
            invites: [{ email: '', role: 'barrister' }],
            chambersFound: null,
            mode: 'joined',
            firstVisit: true,
            celebrationShown: false,
          });
          navigate(form.role === 'clerk' ? '/onboarding/clerk/step/1' : '/onboarding/barrister/lookup');
        }}
      />
    </AuthSplitLayout>
  );
}
