import React, { useState } from 'react';
import { X } from 'lucide-react';
import { API_BASE } from '../config';

function normalizePhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length > 10) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length > 10) digits = digits.slice(1);
  return /^\d{10}$/.test(digits) ? digits : '';
}

export default function AuthModal({ isOpen, onClose, onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const isSignup = mode === 'signup';
  const changeMode = (nextMode) => {
    setMode(nextMode);
    setError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const normalizedPhone = isSignup ? normalizePhone(phone) : '';
    if (isSignup && !normalizedPhone) {
      setError('Enter a valid 10-digit Indian phone number.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/auth/${isSignup ? 'signup' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isSignup ? { name: name.trim(), phone: normalizedPhone } : {}),
          email: email.trim().toLowerCase(),
          password
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to authenticate. Please try again.');
      onAuthenticated(data);
    } catch (requestError) {
      setError(requestError.message || 'Could not reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = 'mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100';
  const requiredMark = <span className="text-red-500">*</span>;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="customer-auth-title" className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <button type="button" onClick={onClose} aria-label="Close account dialog" className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={19} /></button>
        <h2 id="customer-auth-title" className="text-2xl font-black text-slate-900">{isSignup ? 'Create your account' : 'Welcome back'}</h2>
        <p className="mt-1 text-sm text-slate-500">Sign in to your Urbab366 customer account.</p>

        <div className="mt-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
          <button type="button" onClick={() => changeMode('login')} className={`rounded-lg py-2 text-sm font-bold ${!isSignup ? 'bg-white text-violet-800 shadow-sm' : 'text-slate-600'}`}>Login</button>
          <button type="button" onClick={() => changeMode('signup')} className={`rounded-lg py-2 text-sm font-bold ${isSignup ? 'bg-white text-violet-800 shadow-sm' : 'text-slate-600'}`}>Create Account</button>
        </div>

        {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}

        <form onSubmit={submit} className="mt-5 space-y-4">
          {isSignup && <label className="block text-sm font-semibold text-slate-700">
            Full Name {requiredMark}
            <input autoComplete="name" className={inputClass} value={name} onChange={event => setName(event.target.value)} required />
          </label>}
          <label className="block text-sm font-semibold text-slate-700">
            Email ID {requiredMark}
            <input type="email" autoComplete="email" className={inputClass} value={email} onChange={event => setEmail(event.target.value)} required />
          </label>
          {isSignup && <label className="block text-sm font-semibold text-slate-700">
            Phone Number {requiredMark}
            <input type="tel" inputMode="tel" autoComplete="tel" className={inputClass} value={phone} onChange={event => setPhone(event.target.value)} required placeholder="10-digit Indian mobile number" />
          </label>}
          <label className="block text-sm font-semibold text-slate-700">
            Password {requiredMark}
            <input type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} className={inputClass} value={password} onChange={event => setPassword(event.target.value)} required />
          </label>
          <button type="submit" disabled={submitting} className="w-full rounded-xl bg-violet-700 py-3 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-60">
            {submitting ? 'Please wait…' : isSignup ? 'Create Account' : 'Login'}
          </button>
        </form>
      </section>
    </div>
  );
}
