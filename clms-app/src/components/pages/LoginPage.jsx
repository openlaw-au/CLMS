import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import LoginForm from '../organisms/LoginForm';

export default function LoginPage() {
  const navigate = useNavigate();
  const { role, updateOnboarding } = useAppContext();

  return (
    <div className="app-shell-bg motion-slide flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <LoginForm
        onSubmit={(form) => {
          updateOnboarding({ email: form.email });
          navigate(role === 'clerk' ? '/app/dashboard' : '/app/search');
        }}
      />
    </div>
  );
}
