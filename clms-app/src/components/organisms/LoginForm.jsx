import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../atoms/Button';
import FormField from '../molecules/FormField';
import PersonaToggle from '../atoms/PersonaToggle';
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
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          <span className={`h-2 w-2 rounded-full ${role === 'clerk' ? 'bg-blue-500' : 'bg-brand'}`} />
          {content.badge}
        </div>
        <h1 className="mt-4 font-serif text-4xl leading-none text-text">Welcome back</h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">{content.formDescription}</p>
      </div>

      <div>
        <p className="mb-2 block text-sm font-medium text-text-secondary">Role</p>
        <PersonaToggle value={role} onChange={onRoleChange} className="w-full" />
      </div>

      <FormField required label="Email" type="email" placeholder="james@chambers.com" value={form.email} onChange={handleChange('email')} autoFocus />
      <FormField required label="Password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange('password')} />
      <div className="-mt-2 text-right">
        <button type="button" className="text-sm text-brand hover:text-brand-hover">Forgot password?</button>
      </div>
      <div className="pt-2">
        <Button type="submit" className={`w-full ${!isValid ? 'opacity-40' : ''}`} variant="primary" loading={loading} disabled={!isValid}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </div>
      <p className="text-sm text-text-tertiary">Don't have an account? <Link to={`/signup?role=${role}`} className="text-brand hover:text-brand-hover">Sign up</Link></p>
    </form>
  );
}
