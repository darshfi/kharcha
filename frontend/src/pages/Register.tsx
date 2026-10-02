import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const signedIn = await register(email, password, fullName);
      if (signedIn) navigate('/');
      else setNotice('Account created. Check your inbox to confirm your email, then sign in.');
    } catch (err: any) {
      setError(err?.message ?? 'Could not create your account');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen flex min-h-screen flex-col">
      <div className="flex justify-end p-4">
        <ThemeToggle />
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 pb-20">
        <div className="mb-8">
          <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-lg font-semibold text-on-accent">
            L
          </div>
          <h1 className="title">Create an account</h1>
          <p className="label mt-2">Start tracking in under a minute</p>
        </div>

        <form onSubmit={handleSubmit} className="stack gap-4">
          {error && (
            <div className="rounded-xl border border-negative/30 bg-negative-soft px-4 py-3 text-[13px] text-negative">
              {error}
            </div>
          )}
          {notice && (
            <div className="rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-[13px] text-accent">
              {notice}
            </div>
          )}

          <div>
            <label className="field-label" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              className="field"
              placeholder="Your name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="field"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="field"
              placeholder="At least 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={busy} className="btn-primary mt-2 w-full">
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <p className="mt-8 text-center text-[13px] text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent transition-colors hover:text-accent-hover">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
