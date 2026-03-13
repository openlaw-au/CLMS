import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import LoginForm from '../organisms/LoginForm';
import AuthSplitLayout from '../templates/AuthSplitLayout';

export default function LoginPage() {
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
    <AuthSplitLayout role={selectedRole} mode="login">
      <LoginForm
        role={selectedRole}
        onRoleChange={handleRoleChange}
        onSubmit={(form) => {
          setRole(form.role);
          updateOnboarding({ email: form.email });
          navigate('/app/dashboard');
        }}
      />
    </AuthSplitLayout>
  );
}
