import { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../atoms/Logo';
import PersonaToggle from '../atoms/PersonaToggle';
import Button from '../atoms/Button';
import FormField from '../molecules/FormField';

export default function SignUpForm({ initialRole, onSubmit }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: initialRole,
  });
  const [loading, setLoading] = useState(false);

  const isValid = form.name.trim() && form.email.trim() && form.password.trim();

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
      <h1 className="mb-6 text-center font-serif text-3xl text-text">Create your account</h1>
      <FormField required label="Name" placeholder="James Smith" value={form.name} onChange={handleChange('name')} autoFocus />
      <FormField required label="Email" type="email" placeholder="james@chambers.com" value={form.email} onChange={handleChange('email')} />
      <FormField required label="Password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange('password')} />
      <div>
        <p className="mb-1 block text-sm font-medium text-text-secondary">Role</p>
        <PersonaToggle value={form.role} onChange={(next) => setForm((prev) => ({ ...prev, role: next }))} className="w-full" />
      </div>
      <div className="pt-2">
        <Button type="submit" className={`w-full ${!isValid ? 'opacity-40' : ''}`} variant="primary" loading={loading} disabled={!isValid}>
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
      </div>
      <p className="text-center text-sm text-text-tertiary">Already have an account? <Link to="/login" className="text-brand hover:text-brand-hover">Log in</Link></p>
      <div className="flex justify-center pt-2">
        <Logo className="h-6 opacity-30" />
      </div>
    </form>
  );
}
