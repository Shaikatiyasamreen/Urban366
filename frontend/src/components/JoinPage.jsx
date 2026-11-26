import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BriefcaseBusiness, CheckCircle2 } from 'lucide-react';
import { API_BASE } from '../config';
import LaborerForm from './LaborerForm';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[6-9]\d{9}$/;

function validateLoginField(field, value) {
  if (field === 'identifier') {
    const normalized = value.trim();
    return (normalized.includes('@') ? EMAIL_PATTERN.test(normalized) : PHONE_PATTERN.test(normalized))
      ? ''
      : 'Enter a valid email address or 10-digit Indian mobile number.';
  }
  if (field === 'password') return value.trim() ? '' : 'Password is required.';
  return '';
}

export default function JoinPage({ onNavigateHome, onNavigateDashboard, initialMode = 'register' }) {
  const [mode, setMode] = useState(initialMode);
  const [submitting, setSubmitting] = useState(false);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [login, setLogin] = useState({ identifier: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({});
  const [loginTouched, setLoginTouched] = useState({});
  const [loginAttempted, setLoginAttempted] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const loginRefs = useRef({});

  useEffect(() => {
    const token = localStorage.getItem('urbab366_employee_token');
    if (!token) return;
    fetch(`${API_BASE}/employee/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async response => {
        const data = await response.json();
        if (response.ok && data.employee) onNavigateDashboard();
        else if (response.status === 401) localStorage.removeItem('urbab366_employee_token');
      })
      .catch(error => console.error('Unable to verify employee session:', error));
  }, [onNavigateDashboard]);

  const register = async payload => {
    setSubmitting(true);
    setFormError('');
    setSuccess('');
    try {
      const response = await fetch(`${API_BASE}/employee/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) {
        const requestError = new Error(result.message || result.error || 'Registration failed. Please try again.');
        requestError.errors = result.errors;
        requestError.status = response.status;
        throw requestError;
      }
      localStorage.setItem('urbab366_employee_token', result.token);
      setSuccess(`Welcome, ${result.employee.name}. Your employee profile is active.`);
      onNavigateDashboard();
    } finally {
      setSubmitting(false);
    }
  };

  const updateLoginField = (field, value) => {
    setLogin(current => ({ ...current, [field]: value }));
    setFormError('');
    if (loginAttempted || loginTouched[field]) {
      const error = validateLoginField(field, value);
      setLoginErrors(current => {
        const next = { ...current };
        if (error) next[field] = error;
        else delete next[field];
        return next;
      });
    }
  };

  const blurLoginField = field => {
    setLoginTouched(current => ({ ...current, [field]: true }));
    const error = validateLoginField(field, login[field]);
    setLoginErrors(current => {
      const next = { ...current };
      if (error) next[field] = error;
      else delete next[field];
      return next;
    });
  };

  const submitLogin = async event => {
    event.preventDefault();
    if (loginSubmitting) return;
    setLoginAttempted(true);
    setLoginTouched({ identifier: true, password: true });
    const errors = Object.fromEntries(
      Object.entries(login).map(([field, value]) => [field, validateLoginField(field, value)]).filter(([, error]) => error)
    );
    setLoginErrors(errors);
    if (Object.keys(errors).length) {
      const firstInvalid = Object.keys(login).find(field => errors[field]);
      loginRefs.current[firstInvalid]?.focus();
      loginRefs.current[firstInvalid]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setLoginSubmitting(true);
    setFormError('');
    try {
      const response = await fetch(`${API_BASE}/employee/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: login.identifier.trim(), password: login.password })
      });
      const result = await response.json();
      if (!response.ok) {
        const errorsFromServer = result.errors && typeof result.errors === 'object' ? result.errors : {};
        const fields = Object.keys(login);
        const mapped = Object.fromEntries(Object.entries(errorsFromServer).filter(([field]) => fields.includes(field)));
        if (Object.keys(mapped).length) {
          setLoginErrors(current => ({ ...current, ...mapped }));
          const firstInvalid = fields.find(field => mapped[field]);
          loginRefs.current[firstInvalid]?.focus();
          loginRefs.current[firstInvalid]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          setFormError(result.error || result.message || 'Unable to log in. Please try again.');
        }
        return;
      }
      localStorage.setItem('urbab366_employee_token', result.token);
      onNavigateDashboard();
    } catch (requestError) {
      setFormError(requestError.message || 'Could not reach the server.');
    } finally {
      setLoginSubmitting(false);
    }
  };

  const changeMode = nextMode => {
    setMode(nextMode);
    setFormError('');
    setLoginErrors({});
    setLoginTouched({});
    setLoginAttempted(false);
  };

  const loginControlClass = field => `mt-1 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 ${loginErrors[field] ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-violet-500 focus:ring-violet-100'}`;

  return <main className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
    <div className="mx-auto max-w-2xl">
      <button type="button" onClick={onNavigateHome} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-violet-700"><ArrowLeft size={17} /> Back to home</button>
      <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-8">
        <div className="mb-5 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><BriefcaseBusiness size={21} /></span><div><h1 className="text-2xl font-black text-slate-900">Employee Portal</h1><p className="mt-1 text-sm text-slate-600">Register to offer your services or log in to manage your work.</p></div></div>
        <div className="mb-6 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => changeMode('register')} aria-pressed={mode === 'register'} className={`rounded-xl border px-3 py-3 text-sm font-bold ${mode === 'register' ? 'border-violet-700 bg-violet-700 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-violet-300'}`}>Register as Employee</button>
          <button type="button" onClick={() => changeMode('login')} aria-pressed={mode === 'login'} className={`rounded-xl border px-3 py-3 text-sm font-bold ${mode === 'login' ? 'border-violet-700 bg-violet-700 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-violet-300'}`}>Employee Login</button>
        </div>

        {formError && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
        {success && <p role="status" className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 size={17} />{success}</p>}

        {mode === 'register' ? <>
          <p className="mb-5 text-sm text-slate-500">Your profile becomes active as soon as you register. Choose up to three services you provide.</p>
          <LaborerForm employeeRegistration onSubmit={register} onRequestError={setFormError} submitting={submitting} submitLabel="Create Employee Account" />
        </> : <form noValidate onSubmit={submitLogin} className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700">Email ID or Phone Number <span className="text-red-500">*</span>
            <input ref={element => { loginRefs.current.identifier = element; }} autoComplete="username" aria-invalid={Boolean(loginErrors.identifier)} className={loginControlClass('identifier')} value={login.identifier} onChange={event => {
              const value = event.target.value;
              const identifier = /[A-Za-z@]/.test(value) ? value : value.replace(/\D/g, '').slice(0, 10);
              updateLoginField('identifier', identifier);
            }} onBlur={() => blurLoginField('identifier')} placeholder="name@example.com or 10-digit number" required />
            {loginErrors.identifier && <p className="text-red-500 text-xs mt-1">{loginErrors.identifier}</p>}
          </label>
          <label className="block text-sm font-semibold text-slate-700">Password <span className="text-red-500">*</span>
            <input ref={element => { loginRefs.current.password = element; }} type="password" autoComplete="current-password" aria-invalid={Boolean(loginErrors.password)} className={loginControlClass('password')} value={login.password} onChange={event => updateLoginField('password', event.target.value)} onBlur={() => blurLoginField('password')} required />
            {loginErrors.password && <p className="text-red-500 text-xs mt-1">{loginErrors.password}</p>}
          </label>
          <button type="submit" disabled={loginSubmitting} className="w-full rounded-xl bg-violet-700 px-5 py-3 font-bold text-white hover:bg-violet-800 disabled:opacity-60">{loginSubmitting ? 'Signing in…' : 'Log in to Employee Dashboard'}</button>
        </form>}
      </section>
    </div>
  </main>;
}
