import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, LogOut, RefreshCw, MapPin, Phone } from 'lucide-react';
import { API_BASE } from '../config';
import LaborerForm from './LaborerForm';

const STATUS_CLASSES = {
  'New Task Assigned': 'bg-blue-50 text-blue-700',
  Pending: 'bg-amber-50 text-amber-700',
  'In Progress': 'bg-violet-50 text-violet-700',
  Completed: 'bg-emerald-50 text-emerald-700'
};

function isPending(status) {
  return status === 'Pending' || status === 'New Task Assigned';
}

export default function EmployeeDashboard({ onNavigateHome, onNavigateJoin }) {
  const [employee, setEmployee] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workingId, setWorkingId] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState('');

  const loadDashboard = useCallback(async () => {
    const token = localStorage.getItem('urbab366_employee_token');
    if (!token) {
      onNavigateJoin();
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const responses = await Promise.all([
        fetch(`${API_BASE}/employee/me`, { headers }),
        fetch(`${API_BASE}/employee/jobs`, { headers }),
        fetch(`${API_BASE}/employee/slot-alerts`, { headers })
      ]);
      const results = await Promise.all(responses.map(response => response.json()));
      const unauthorized = responses.some(response => response.status === 401);
      if (unauthorized) {
        localStorage.removeItem('urbab366_employee_token');
        onNavigateJoin();
        return;
      }
      const failed = responses.findIndex(response => !response.ok);
      if (failed >= 0) throw new Error(results[failed].error || 'Could not load employee dashboard.');
      setEmployee(results[0].employee);
      setJobs(results[1].jobs || []);
      setAlerts(results[2].alerts || []);
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Could not reach the server.');
    } finally {
      setLoading(false);
    }
  }, [onNavigateJoin]);

  useEffect(() => {
    const initialLoad = window.setTimeout(loadDashboard, 0);
    const intervalId = window.setInterval(loadDashboard, 15000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(intervalId);
    };
  }, [loadDashboard]);

  const metrics = useMemo(() => ({
    total: jobs.length,
    pending: jobs.filter(job => isPending(job.status)).length,
    inProgress: jobs.filter(job => job.status === 'In Progress').length,
    completed: jobs.filter(job => job.status === 'Completed').length
  }), [jobs]);

  const dateBreakdown = useMemo(() => {
    const counts = new Map();
    jobs.forEach(job => counts.set(job.job_date, (counts.get(job.job_date) || 0) + 1));
    return [...counts.entries()].sort(([first], [second]) => first.localeCompare(second));
  }, [jobs]);

  const updateJob = async (job, status) => {
    setWorkingId(job.id);
    setError('');
    try {
      const token = localStorage.getItem('urbab366_employee_token');
      const response = await fetch(`${API_BASE}/employee/jobs/${job.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      const result = await response.json();
      if (response.status === 401) {
        localStorage.removeItem('urbab366_employee_token');
        onNavigateJoin();
        return;
      }
      if (!response.ok) throw new Error(result.error || result.message || 'Could not update job status.');
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message || 'Could not update job status.');
    } finally {
      setWorkingId(null);
    }
  };

  const respondToAlert = async (alert, action) => {
    setWorkingId(`alert-${alert.id}`);
    setError('');
    try {
      const token = localStorage.getItem('urbab366_employee_token');
      const response = await fetch(`${API_BASE}/employee/slot-alerts/${alert.id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (response.status === 401) {
        localStorage.removeItem('urbab366_employee_token');
        onNavigateJoin();
        return;
      }
      if (!response.ok) throw new Error(result.error || 'Could not update slot request.');
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message || 'Could not update slot request.');
    } finally {
      setWorkingId(null);
    }
  };

  const saveProfile = async payload => {
    setSavingProfile(true);
    setError('');
    setProfileNotice('');
    try {
      const token = localStorage.getItem('urbab366_employee_token');
      const response = await fetch(`${API_BASE}/employee/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (response.status === 401) {
        localStorage.removeItem('urbab366_employee_token');
        onNavigateJoin();
        return;
      }
      if (!response.ok) {
        const requestError = new Error(result.message || result.error || 'Could not save your profile.');
        requestError.errors = result.errors;
        requestError.status = response.status;
        throw requestError;
      }
      setEmployee(result.employee);
      setEditingProfile(false);
      setProfileNotice('Your profile was updated.');
    } finally {
      setSavingProfile(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('urbab366_employee_token');
    onNavigateJoin();
  };

  const statCards = [
    ['Total Jobs Assigned', metrics.total],
    ['New / Pending Jobs', metrics.pending],
    ['In Progress Jobs', metrics.inProgress],
    ['Completed Jobs', metrics.completed]
  ];

  return <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-9">
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <button type="button" onClick={onNavigateHome} className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-500"><ArrowLeft size={14} /> Customer home</button>
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">{employee ? `Welcome, ${employee.name}` : 'Employee dashboard'}</h1>
          <p className="mt-1 text-sm text-slate-500">Your jobs and work schedule update automatically every 15 seconds.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={loadDashboard} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"><RefreshCw size={15} /> Refresh</button>
          <button type="button" onClick={() => setEditingProfile(open => !open)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold">{editingProfile ? 'Close profile' : 'Edit profile'}</button>
          <button type="button" onClick={logout} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"><LogOut size={15} /> Log out</button>
        </div>
      </header>

      {error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {profileNotice && <p role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{profileNotice}</p>}
      {loading && <p className="mb-4 rounded-xl bg-white p-4 text-sm text-slate-500">Loading your schedule…</p>}

      {editingProfile && employee && <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-1 text-xl font-bold text-slate-900">Manage your profile</h2>
        <p className="mb-5 text-sm text-slate-500">Update your contact details, services, expertise and work areas.</p>
        <LaborerForm key={`employee-profile-${employee.id}`} initialValue={employee} onSubmit={saveProfile} onRequestError={setError} submitting={savingProfile} submitLabel="Save Profile" />
      </section>}

      <section className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map(([title, count]) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-black text-slate-900">{count}</p><p className="mt-1 text-xs font-semibold text-slate-500">{title}</p>
        </article>)}
      </section>

      {alerts.length > 0 && <section className="mb-7 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="mb-4"><h2 className="text-lg font-bold text-amber-950">Missed / Requested Slot Alerts</h2><p className="text-sm text-amber-800">Customers requested a time slot that was already occupied. Accept an extra task only if you can accommodate it.</p></div>
        <div className="grid gap-3">
          {alerts.map(alert => <article key={alert.id} className="rounded-xl border border-amber-200 bg-white p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <div><h3 className="font-bold text-slate-900">{alert.service} · {alert.job_date} · {alert.time_slot}</h3><p className="mt-1 text-sm text-slate-600">{alert.customer_name} · <a className="text-violet-700" href={`tel:${alert.customer_phone}`}>{alert.customer_phone}</a></p></div>
              <span className="h-fit rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">Requested</span>
            </div>
            <p className="mt-2 flex gap-2 text-sm text-slate-600"><MapPin size={16} className="mt-0.5 shrink-0" />{alert.address}</p>
            {alert.work_description && <p className="mt-2 text-sm text-slate-600">Notes: {alert.work_description}</p>}
            <div className="mt-4 flex gap-2">
              <button type="button" disabled={Boolean(workingId)} onClick={() => respondToAlert(alert, 'accept')} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-60">{workingId === `alert-${alert.id}` ? 'Saving…' : 'Accept Extra Task'}</button>
              <button type="button" disabled={Boolean(workingId)} onClick={() => respondToAlert(alert, 'dismiss')} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 disabled:opacity-60">Dismiss</button>
            </div>
          </article>)}
        </div>
      </section>}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <section className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Date-Wise Job Breakdown</h2>
          {dateBreakdown.length ? <ul className="space-y-2">{dateBreakdown.map(([jobDate, count]) => <li key={jobDate} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"><span>{jobDate}</span><strong>{count} {count === 1 ? 'job' : 'jobs'}</strong></li>)}</ul> : <p className="text-sm text-slate-500">No jobs assigned yet.</p>}
        </section>
        <section>
          <div className="mb-3"><h2 className="text-xl font-bold text-slate-900">Daily Work Schedule</h2><p className="text-sm text-slate-500">Customer contact, address, service and status for each assigned job.</p></div>
          {jobs.length === 0 ? <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No assigned jobs yet.</p> : <div className="space-y-3">
            {jobs.map(job => <article key={job.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="text-base font-bold text-slate-900">{job.service} · {job.job_date} · {job.time_slot}</h3><p className="mt-1 text-sm text-slate-600">{job.customer_name}</p></div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_CLASSES[job.status] || 'bg-slate-100 text-slate-700'}`}>{job.status}</span>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                <a className="inline-flex items-center gap-2 text-violet-700" href={`tel:${job.customer_phone}`}><Phone size={15} />{job.customer_phone}</a>
                <p className="inline-flex items-start gap-2"><MapPin size={15} className="mt-0.5 shrink-0" />{job.service_address || job.address}</p>
                {job.work_description && <p className="sm:col-span-2">Notes: {job.work_description}</p>}
              </div>
              {isPending(job.status) && <button type="button" disabled={Boolean(workingId)} onClick={() => updateJob(job, 'In Progress')} className="mt-4 rounded-lg bg-violet-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{workingId === job.id ? 'Updating…' : 'Reached Location / Start Work'}</button>}
              {job.status === 'In Progress' && <button type="button" disabled={Boolean(workingId)} onClick={() => updateJob(job, 'Completed')} className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{workingId === job.id ? 'Updating…' : 'Mark Work Done'}</button>}
            </article>)}
          </div>}
        </section>
      </div>
    </div>
  </main>;
}
