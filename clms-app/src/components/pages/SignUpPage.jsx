import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import Logo from '../atoms/Logo';
import SignUpForm from '../organisms/SignUpForm';

export default function SignUpPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { role, setRole, updateOnboarding } = useAppContext();

  const queryRole = searchParams.get('role');
  const activeRole = queryRole === 'clerk' ? 'clerk' : queryRole === 'barrister' ? 'barrister' : role;

  useEffect(() => {
    if (queryRole === 'barrister' || queryRole === 'clerk') {
      setRole(queryRole);
    }
  }, [queryRole, setRole]);

  return (
    <div className="app-shell-bg motion-slide flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <SignUpForm
        initialRole={activeRole}
        onSubmit={(form) => {
          setRole(form.role);
          updateOnboarding({
            name: form.name,
            email: form.email,
            password: form.password,
            chambersName: '',
            chambersAddress: '',
            locations: [{ name: '', floor: '' }],
            invites: [{ email: '', role: 'barrister' }],
            chambersFound: null,
            mode: 'joined',
            firstVisit: true,
            celebrationShown: false,
          });
          navigate(form.role === 'clerk' ? '/onboarding/clerk/step-1' : '/onboarding/barrister/lookup');
        }}
      />
    </div>
  );
}
