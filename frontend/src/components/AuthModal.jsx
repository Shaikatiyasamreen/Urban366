import React, { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { API_BASE } from '../config';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[6-9]\d{9}$/;

function validateName(value) {
  const clean = value.trim();
  return /^[\p{L} ]+$/u.test(clean) && clean.replace(/\s+/g, '').length >= 2
    ? ''
    : 'Enter a valid full name (at least 2 letters).';
}

function validateField(field, value, signup) {
  if (field === 'name' && signup) return validateName(value);
  if (field === 'email') {
    return EMAIL_PATTERN.test(value.trim())
      ? ''
      : 'Enter a valid email address.';
  }
  if (field === 'phone' && signup) {
    return PHONE_PATTERN.test(value)
      ? ''
      : 'Enter a valid 10-digit Indian mobile number.';
  }
  if (field === 'password') {
    if (!value.trim()) return signup ? 'Password must be at least 6 characters.' : 'Password is required.';
    if (signup && Array.from(value).length < 6) return 'Password must be at least 6 characters.';
  }
  return '';
}

export default function AuthModal({ isOpen, initialMode = 'login', onClose, onAuthenticated }) {
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fieldRefs = useRef({});

  if (!isOpen) return null;

  const isSignup = mode === 'signup';
  const fields = isSignup ? ['name', 'email', 'phone', 'password'] : ['email', 'password'];
  const values = { name, email, phone, password };

  const focusFirstInvalid = (errors, fieldOrder = fields) => {
    const firstInvalid = fieldOrder.find(field => errors[field]);
    const element = fieldRefs.current[firstInvalid];
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const validateCurrentField = (field, value, shouldValidate) => {
    if (!shouldValidate) return;
    const error = validateField(field, value, isSignup);
    setFieldErrors(current => {
      const next = { ...current };
      if (error) next[field] = error;
      else delete next[field];
      return next;
    });
  };

  const updateField = (field, value) => {
    const setters = { name: setName, email: setEmail, phone: setPhone, password: setPassword };
    setters[field](value);
    setFormError('');
    validateCurrentField(field, value, submitted || touched[field]);
  };

  const blurField = (field) => {
    setTouched(current => ({ ...current, [field]: true }));
    validateCurrentField(field, values[field], true);
  };

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setFieldErrors({});
    setTouched({});
    setSubmitted(false);
    setFormError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setFormError('');
    setSubmitted(true);
    const nextErrors = {};
    for (const field of fields) {
      const error = validateField(field, values[field], isSignup);
      if (error) nextErrors[field] = error;
    }
    setTouched(Object.fromEntries(fields.map(field => [field, true])));
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      focusFirstInvalid(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/auth/${isSignup ? 'signup' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isSignup ? { name: name.trim(), phone } : {}),
          email: email.trim().toLowerCase(),
          password
        })
      });
      const data = await response.json();
      if (!response.ok) {
        const backendErrors = data.errors && typeof data.errors === 'object' ? data.errors : {};
        const recognizedErrors = Object.fromEntries(
          Object.entries(backendErrors).filter(([field]) => fields.includes(field))
        );
        if (Object.keys(recognizedErrors).length) {
          setFieldErrors(current => ({ ...current, ...recognizedErrors }));
          setTouched(current => ({ ...current, ...Object.fromEntries(Object.keys(recognizedErrors).map(field => [field, true])) }));
          focusFirstInvalid(recognizedErrors);
          const unexpectedField = Object.keys(backendErrors).some(field => !fields.includes(field));
          if (unexpectedField) setFormError(data.message || 'Please try again.');
          return;
        }
        if (data.error === 'An account with this email already exists.') {
          setFieldErrors(current => ({ ...current, email: data.error }));
          setTouched(current => ({ ...current, email: true }));
          focusFirstInvalid({ email: data.error });
          return;
        }
        if (data.error === 'An account with this phone number already exists.') {
          setFieldErrors(current => ({ ...current, phone: data.error }));
          setTouched(current => ({ ...current, phone: true }));
          focusFirstInvalid({ phone: data.error });
          return;
        }
        setFormError(data.message || data.error || 'Unable to authenticate. Please try again.');
        return;
      }
      onAuthenticated(data);
    } catch (requestError) {
      setFormError(requestError.message || 'Could not reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = field => [
    'mt-1 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2',
    fieldErrors[field]
      ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
      : 'border-slate-200 focus:border-violet-500 focus:ring-violet-100'
  ].join(' ');
  const requiredMark = <span className="text-red-500">*</span>;
  const fieldError = field => fieldErrors[field] && (
    <p className="text-red-500 text-xs mt-1">{fieldErrors[field]}</p>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="customer-auth-title" className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <button type="button" onClick={onClose} aria-label="Close account dialog" className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={19} /></button>
        <h2 id="customer-auth-title" className="text-2xl font-black text-slate-900">{isSignup ? 'Create your account' : 'Welcome back'}</h2>
        <p className="mt-1 text-sm text-slate-500">{isSignup ? 'Create an account to book and manage services.' : 'Sign in to your Urbab366 customer account.'}</p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => changeMode('login')} aria-pressed={!isSignup} className={`w-full rounded-xl border py-3 text-sm font-bold transition-colors ${!isSignup ? 'border-violet-700 bg-violet-700 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:text-violet-800'}`}>Login</button>
          <button type="button" onClick={() => changeMode('signup')} aria-pressed={isSignup} className={`w-full rounded-xl border py-3 text-sm font-bold transition-colors ${isSignup ? 'border-violet-700 bg-violet-700 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:text-violet-800'}`}>Create Account <span className="block text-xs font-semibold">(Sign Up)</span></button>
        </div>

        {formError && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{formError}</p>}

        <form noValidate onSubmit={submit} className="mt-5 space-y-4">
          {isSignup && <label className="block text-sm font-semibold text-slate-700">
            Full Name {requiredMark}
            <input ref={element => { fieldRefs.current.name = element; }} autoComplete="name" aria-invalid={Boolean(fieldErrors.name)} className={inputClass('name')} value={name} onChange={event => updateField('name', event.target.value)} onBlur={() => blurField('name')} required />
            {fieldError('name')}
          </label>}
          <label className="block text-sm font-semibold text-slate-700">
            Email ID {requiredMark}
            <input ref={element => { fieldRefs.current.email = element; }} type="email" autoComplete="email" aria-invalid={Boolean(fieldErrors.email)} className={inputClass('email')} value={email} onChange={event => updateField('email', event.target.value)} onBlur={() => blurField('email')} required />
            {fieldError('email')}
          </label>
          {isSignup && <label className="block text-sm font-semibold text-slate-700">
            Phone Number {requiredMark}
            <input ref={element => { fieldRefs.current.phone = element; }} type="tel" inputMode="numeric" autoComplete="tel" aria-invalid={Boolean(fieldErrors.phone)} className={inputClass('phone')} value={phone} onChange={event => updateField('phone', event.target.value)} onBlur={() => blurField('phone')} required placeholder="10-digit Indian mobile number" />
            {fieldError('phone')}
          </label>}
          <label className="block text-sm font-semibold text-slate-700">
            Password {requiredMark}
            <input ref={element => { fieldRefs.current.password = element; }} type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} aria-invalid={Boolean(fieldErrors.password)} className={inputClass('password')} value={password} onChange={event => updateField('password', event.target.value)} onBlur={() => blurField('password')} required />
            {fieldError('password')}
          </label>
          <button type="submit" disabled={submitting} className="w-full rounded-xl bg-violet-700 py-3 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-60">
            {submitting ? 'Please wait…' : isSignup ? 'Create Account (Sign Up)' : 'Login'}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-slate-600">
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <button type="button" onClick={() => changeMode(isSignup ? 'login' : 'signup')} className="font-bold text-violet-700 underline decoration-violet-300 underline-offset-2 hover:text-violet-900">
            {isSignup ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </section>
    </div>
  );
}
