import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, LogOut, RefreshCw, ShieldCheck, Users, UserPlus, UserCheck, Clock3, Pencil, Trash2 } from 'lucide-react';
import { API_BASE } from '../config';
import LaborerForm from './LaborerForm';

export default function AdminDashboard({ onNavigateHome }) {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem('urbab366_admin_key') || '');
  const [authenticated, setAuthenticated] = useState(false);
  const [laborers, setLaborers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formVersion, setFormVersion] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [password, setPassword] = useState('');

  const request = async (path, options = {}, key = adminKey) => {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...(options.headers || {}), 'x-admin-key': key }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed.');
    return data;
  };

  const fetchLaborers = async (key = adminKey) => {
    setLoading(true);
    setError('');
    try {
      const data = await request('/admin/laborers', {}, key);
      setLaborers(data);
    } catch (requestError) {
      setError(requestError.message || 'Could not load workers.');
      if (requestError.message.includes('Unauthorized')) {
        setAuthenticated(false);
        sessionStorage.removeItem('urbab366_admin_key');
      }
    } finally {
      setLoading(false);
    }
  };

  const verify = async (key) => {
    setError('');
    try {
      await request('/admin/verify', { method: 'POST' }, key);
      sessionStorage.setItem('urbab366_admin_key', key);
      setAdminKey(key);
      setAuthenticated(true);
      await fetchLaborers(key);
    } catch (requestError) {
      setAuthenticated(false);
      setError(requestError.message || 'Unable to verify password.');
    }
  };

  useEffect(() => {
    if (adminKey) verify(adminKey);
  // Verify a saved session once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = () => {
    sessionStorage.removeItem('urbab366_admin_key');
    setAdminKey('');
    setPassword('');
    setAuthenticated(false);
    setLaborers([]);
    setEditing(null);
  };

  const saveLaborer = async (payload, id) => {
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const data = await request(id ? `/admin/laborers/${id}` : '/admin/laborers', {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (id) {
        setLaborers(current => current.map(worker => worker.id === data.id ? data : worker));
        setEditing(null);
        setNotice(`${data.name}'s profile was updated.`);
      } else {
        setLaborers(current => [data, ...current]);
        setFormVersion(current => current + 1);
        setNotice(`${data.name} was added.`);
      }
    } catch (requestError) {
      setError(requestError.message || 'Could not save worker details.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteLaborer = async (worker) => {
    if (!window.confirm(`Delete ${worker.name}'s worker record?`)) return;
    setError('');
    try {
      await request(`/admin/laborers/${worker.id}`, { method: 'DELETE' });
      setLaborers(current => current.filter(item => item.id !== worker.id));
      setNotice(`${worker.name}'s record was deleted.`);
      if (editing?.id === worker.id) setEditing(null);
    } catch (requestError) {
      setError(requestError.message || 'Could not delete worker.');
    }
  };

  const summary = useMemo(() => ({
    total: laborers.length,
    available: laborers.filter(worker => worker.availability_status === 'Available').length,
    admin: laborers.filter(worker => worker.registered_by === 'Admin').length,
    self: laborers.filter(worker => worker.registered_by === 'Self').length
  }), [laborers]);

  if (!authenticated) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <form onSubmit={event => { event.preventDefault(); verify(password.trim()); }} className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl">
        <button type="button" onClick={onNavigateHome} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft size={16} /> Back to home</button>
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700"><ShieldCheck /></div>
        <h1 className="text-2xl font-black text-slate-900">Admin dashboard</h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">Enter your administrator password to manage workers.</p>
        {error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <label className="mb-4 block text-sm font-semibold text-slate-700">Admin password
          <input autoFocus type="password" value={password} onChange={event => setPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-violet-500" required />
        </label>
        <button className="w-full rounded-xl bg-violet-700 py-3 font-bold text-white hover:bg-violet-800">Sign in</button>
      </form>
    </main>;
  }

  const statCards = [
    { title: 'Total Laborers', count: summary.total, icon: Users, iconClass: 'bg-violet-50 text-violet-700' },
    { title: 'Available Now', count: summary.available, icon: UserCheck, iconClass: 'bg-emerald-50 text-emerald-700' },
    { title: 'Added by Admin', count: summary.admin, icon: UserPlus, iconClass: 'bg-blue-50 text-blue-700' },
    { title: 'Self-Registered', count: summary.self, icon: Clock3, iconClass: 'bg-amber-50 text-amber-700' }
  ];

  return <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-9">
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><button onClick={onNavigateHome} className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-500"><ArrowLeft size={14} /> Customer home</button><h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Worker management</h1></div>
        <div className="flex gap-2">
          <button onClick={() => fetchLaborers()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"><RefreshCw size={15} /> Refresh</button>
          <button onClick={logout} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"><LogOut size={15} /> Log out</button>
        </div>
      </header>

      {error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

      <section className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map(({ title, count, icon: Icon, iconClass }) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${iconClass}`}><Icon size={18} /></div>
          <p className="text-2xl font-black text-slate-900">{count}</p><p className="mt-1 text-xs font-semibold text-slate-500">{title}</p>
        </article>)}
      </section>

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-1 text-xl font-bold text-slate-900">Add laborer</h2>
        <p className="mb-5 text-sm text-slate-500">For assisted onboarding, record the worker’s details while speaking with them.</p>
        <LaborerForm key={formVersion} admin onSubmit={payload => saveLaborer(payload)} submitting={submitting} submitLabel="Add worker" />
      </section>

      {editing && <section className="mb-8 rounded-2xl border border-violet-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-bold text-slate-900">Edit {editing.name}</h2><p className="text-sm text-slate-500">Update services, address, approval, or availability.</p></div><button onClick={() => setEditing(null)} className="text-sm font-semibold text-slate-500">Cancel</button></div>
        <LaborerForm key={`edit-${editing.id}-${editing.service_categories}-${editing.approval_status}`} initialValue={editing} admin onSubmit={payload => saveLaborer(payload, editing.id)} submitting={submitting} submitLabel="Save changes" />
      </section>}

      <section>
        <div className="mb-4 flex items-end justify-between"><div><h2 className="text-xl font-bold text-slate-900">Registered workers</h2><p className="text-sm text-slate-500">{laborers.length} worker records</p></div></div>
        {loading ? <p className="rounded-xl bg-white p-6 text-sm text-slate-500">Loading worker records…</p> : laborers.length === 0 ? <p className="rounded-xl bg-white p-6 text-sm text-slate-500">No workers have registered yet.</p> :
          <div className="grid gap-4 md:grid-cols-2">
            {laborers.map(worker => {
              const services = worker.service_list || String(worker.service_categories || '').split(',').map(item => item.trim()).filter(Boolean);
              return <article key={worker.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div><h3 className="font-bold text-slate-900">{worker.name}</h3><a href={`tel:${worker.phone}`} className="text-sm text-violet-700">{worker.phone}</a></div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${worker.availability_status === 'Available' ? 'bg-emerald-50 text-emerald-700' : worker.availability_status === 'Busy' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{worker.availability_status}</span>
                </div>
                <div className="my-3 flex flex-wrap gap-1.5">{services.map(item => <span key={item} className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-800">{item}</span>)}</div>
                <p className="text-sm text-slate-600">{worker.expertise_level} · {worker.experience_years} years · {worker.registered_by}</p>
                <p className="mt-2 text-sm text-slate-600">{worker.full_address || 'Address not recorded'}</p>
                <p className="mt-1 text-xs text-slate-500">Areas: {worker.preferred_localities || '—'}{worker.approval_status === 'Pending' ? ' · Approval pending' : ''}</p>
                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                  <button onClick={() => setEditing(worker)} className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-2 text-sm font-bold text-violet-800"><Pencil size={14} /> Edit</button>
                  <button onClick={() => deleteLaborer(worker)} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700"><Trash2 size={14} /> Delete</button>
                </div>
              </article>;
            })}
          </div>}
      </section>
    </div>
  </main>;
}
