import { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../atoms/Logo';
import Button from '../atoms/Button';
import FormField from '../molecules/FormField';

export default function LoginForm({ onSubmit }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const isValid = form.email.trim() && form.password.trim();

  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const submit = (event) => {
    event.preventDefault();
    setLoading(true);
    setTimeout(() => onSubmit(form), 600);
  };

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-md space-y-4 rounded-3xl border border-border bg-white p-6 shadow-soft sm:p-8">
      <h1 className="mb-6 text-center font-serif text-3xl text-text">Welcome back</h1>
      <FormField required label="Email" type="email" placeholder="james@chambers.com" value={form.email} onChange={handleChange('email')} autoFocus />
      <FormField required label="Password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange('password')} />
      <div className="pt-2">
        <Button type="submit" className={`w-full ${!isValid ? 'opacity-40' : ''}`} variant="primary" loading={loading} disabled={!isValid}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </div>
      <p className="text-center text-sm text-text-tertiary">Don't have an account? <Link to="/signup" className="text-brand hover:text-brand-hover">Sign up</Link></p>
      <div className="flex justify-center pt-2">
        <Logo className="h-6 opacity-30" />
      </div>
    </form>
  );
}
