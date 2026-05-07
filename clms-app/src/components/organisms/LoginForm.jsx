import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../atoms/Button';
import FormField from '../molecules/FormField';
import { authContent } from '../../mocks/authContent';

export default function LoginForm({ role, onRoleChange, onSubmit }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const content = authContent[role].login;

  const isValid = form.email.trim() && form.password.trim();

  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const submit = (event) => {
    event.preventDefault();
    setLoading(true);
    setTimeout(() => onSubmit({ ...form, role }), 600);
  };

  return (
    <form onSubmit={submit} className="w-full space-y-5 rounded-[32px] border border-white/80 bg-white/92 p-7 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur sm:p-8">
      <div>
        <h1 className="font-serif text-4xl leading-none text-text">Welcome back</h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">{content.formDescription}</p>
      </div>

      <FormField required label="Email" type="email" placeholder="james@chambers.com" value={form.email} onChange={handleChange('email')} autoFocus />
      <FormField required label="Password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange('password')} />
      <div className="-mt-2 text-right">
        <button type="button" className="text-sm text-brand hover:text-brand-hover">Forgot password?</button>
      </div>
      <div className="pt-2">
        <Button type="submit" className={`w-full ${!isValid ? 'opacity-40' : ''}`} variant="secondary" loading={loading} disabled={!isValid}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </div>
      <p className="text-sm text-text-tertiary">Don't have an account? <Link to={`/signup?role=${role}`} className="text-brand hover:text-brand-hover">Sign up</Link></p>
    </form>
  );
}
