import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { API_BASE } from '../config';
import LaborerForm from './LaborerForm';

export default function JoinPage({ onNavigateHome }) {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const register = async (payload) => {
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${API_BASE}/laborers/register`, {
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
      setMessage('Thank you. Your details were submitted and are awaiting approval.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <button type="button" onClick={onNavigateHome} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-violet-700"><ArrowLeft size={17} /> Back to home</button>
        <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-8">
          <h1 className="text-2xl font-black text-slate-900">Join as a service professional</h1>
          <p className="mb-6 mt-2 text-sm text-slate-600">Share your skills and the areas where you work. Choose up to three services.</p>
          {message ? <div role="status" className="rounded-2xl bg-emerald-50 p-5 text-emerald-800"><CheckCircle2 className="mb-2" /><p className="font-semibold">{message}</p></div> : <LaborerForm onSubmit={register} onRequestError={setError} submitting={submitting} submitLabel="Submit registration" />}
          {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        </section>
      </div>
    </main>
  );
}
