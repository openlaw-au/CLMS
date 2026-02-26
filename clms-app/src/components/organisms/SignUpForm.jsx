import { useState } from 'react';
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

  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const submit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-md space-y-4 rounded-3xl border border-border bg-white p-6 shadow-soft sm:p-8">
      <h1 className="font-serif text-3xl text-text">Create your account</h1>
      <FormField required label="Name" placeholder="James Smith" value={form.name} onChange={handleChange('name')} autoFocus />
      <FormField required label="Email" type="email" placeholder="james@chambers.com" value={form.email} onChange={handleChange('email')} />
      <FormField required label="Password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange('password')} />
      <div>
        <p className="mb-1 block text-sm font-medium text-text-secondary">Role</p>
        <PersonaToggle value={form.role} onChange={(next) => setForm((prev) => ({ ...prev, role: next }))} />
      </div>
      <Button type="submit" className="w-full" variant={form.role === 'clerk' ? 'clerk' : 'primary'}>
        Create Account
      </Button>
      <p className="text-sm text-text-tertiary">Already have an account? <a href="#" className="text-brand hover:text-brand-hover">Log in</a></p>
    </form>
  );
}
