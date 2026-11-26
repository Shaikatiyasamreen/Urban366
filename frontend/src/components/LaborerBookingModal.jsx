import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { API_BASE } from '../config';
import AuthModal from './AuthModal';

const TIME_SLOTS = [
  '09:00 AM - 11:00 AM',
  '11:00 AM - 01:00 PM',
  '02:00 PM - 04:00 PM',
  '04:00 PM - 06:00 PM'
];

function todayInBengaluru() {
  return new Date(Date.now() + 330 * 60 * 1000).toISOString().slice(0, 10);
}

export default function LaborerBookingModal({ worker, searchedService, requireLogin = false, onClose }) {
  const services = worker.service_list || String(worker.service_categories || '').split(',').map(item => item.trim()).filter(Boolean);
  const [service, setService] = useState(services.find(item => item.toLowerCase() === searchedService.toLowerCase()) || services[0] || '');
  const [jobDate, setJobDate] = useState(todayInBengaluru);
  const [timeSlot, setTimeSlot] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [unavailableSlots, setUnavailableSlots] = useState([]);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');
  const [authOpen, setAuthOpen] = useState(requireLogin);
  const fieldRefs = useRef({});
  const fieldValues = { service, job_date: jobDate, time_slot: timeSlot, service_address: address, work_description: description };

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/laborers/${worker.id}/slots?date=${encodeURIComponent(jobDate)}`)
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || data.message || 'Could not load available time slots.');
        return data;
      })
      .then(data => {
        if (active) {
          setUnavailableSlots(data.unavailable_slots || []);
          setServerError('');
        }
      })
      .catch(error => {
        if (active) setServerError(error.message || 'Could not load available time slots.');
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });
    return () => { active = false; };
  }, [worker.id, jobDate]);

  const validateField = (field, value) => {
    if (field === 'service') return services.includes(value) ? '' : 'Choose a service offered by this employee.';
    if (field === 'job_date') return /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= todayInBengaluru() ? '' : 'Choose today or a future date.';
    if (field === 'time_slot') return TIME_SLOTS.includes(value) && !unavailableSlots.includes(value) ? '' : 'Choose an available time slot.';
    if (field === 'service_address') {
      const clean = typeof value === 'string' ? value.trim() : '';
      if (clean.length < 10) return 'Enter a complete service address (min 10 characters).';
      return /bengaluru|bangalore/i.test(clean) ? '' : 'Enter a service address in Bengaluru.';
    }
    if (field === 'work_description') return typeof value === 'string' ? '' : 'Enter work notes as text.';
    return '';
  };

  const validateFields = () => Object.fromEntries(
    Object.entries(fieldValues)
      .map(([field, value]) => [field, validateField(field, value)])
      .filter(([, error]) => error)
  );

  const focusFirstInvalid = nextErrors => {
    const first = Object.keys(fieldValues).find(field => nextErrors[field]);
    fieldRefs.current[first]?.focus();
    fieldRefs.current[first]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const updateField = (field, value, setter) => {
    setter(value);
    setServerError('');
    if (submitted || touched[field]) {
      const error = validateField(field, value);
      setErrors(current => {
        const next = { ...current };
        if (error) next[field] = error;
        else delete next[field];
        return next;
      });
    }
  };

  const blurField = field => {
    setTouched(current => ({ ...current, [field]: true }));
    const error = validateField(field, fieldValues[field]);
    setErrors(current => {
      const next = { ...current };
      if (error) next[field] = error;
      else delete next[field];
      return next;
    });
  };

  const submit = async event => {
    event.preventDefault();
    if (submitting) return;
    setSubmitted(true);
    setServerError('');
    const nextErrors = validateFields();
    setErrors(nextErrors);
    setTouched(Object.fromEntries(Object.keys(fieldValues).map(field => [field, true])));
    if (Object.keys(nextErrors).length) {
      focusFirstInvalid(nextErrors);
      return;
    }
    const token = localStorage.getItem('urbab366_customer_token');
    if (!token) {
      setAuthOpen(true);
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          employee_id: worker.id,
          service,
          job_date: jobDate,
          time_slot: timeSlot,
          service_address: address.trim(),
          work_description: description.trim()
        })
      });
      const data = await response.json();
      if (response.status === 401) {
        setAuthOpen(true);
        setServerError('Please log in to continue booking.');
        return;
      }
      if (!response.ok) {
        const serverErrors = data.errors && typeof data.errors === 'object' ? data.errors : {};
        const validFields = Object.keys(fieldValues);
        const mapped = Object.fromEntries(Object.entries(serverErrors).filter(([field]) => validFields.includes(field)));
        if (Object.keys(mapped).length) {
          setErrors(current => ({ ...current, ...mapped }));
          focusFirstInvalid(mapped);
        }
        if (response.status === 409) {
          setUnavailableSlots(data.unavailable_slots || unavailableSlots);
          setErrors(current => ({ ...current, time_slot: 'Choose an available time slot.' }));
          setTouched(current => ({ ...current, time_slot: true }));
          setServerError(data.error || 'This employee is already booked for this time slot. Please choose another available slot.');
        } else if (Object.keys(mapped).length === 0) {
          setServerError(data.error || data.message || 'Could not place booking. Please try again.');
        }
        return;
      }
      setSuccess(data.message || `Booking #${data.booking_id} confirmed.`);
    } catch (requestError) {
      setServerError(requestError.message || 'Could not reach the server.');
    } finally {
      setSubmitting(false);
    }
  };

  const controlClass = field => `mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 ${errors[field] ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-slate-200 focus:border-violet-500 focus:ring-violet-100'}`;
  const fieldError = field => errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>;
  const required = <span className="text-red-500">*</span>;

  return <>
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="worker-booking-title" className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
        <header className="mb-5 flex items-start justify-between gap-3">
          <div><h2 id="worker-booking-title" className="text-xl font-black text-slate-900">Book {worker.name}</h2><p className="mt-1 text-sm text-slate-500">Choose a service and an available time slot.</p></div>
          <button type="button" aria-label="Close booking dialog" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
        </header>
        {success ? <div role="status" className="rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{success}<button type="button" onClick={onClose} className="mt-4 block rounded-lg bg-emerald-700 px-4 py-2 text-white">Done</button></div> : <>
          {serverError && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{serverError}</p>}
          <form noValidate onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700">Service Needed {required}
              <select ref={element => { fieldRefs.current.service = element; }} aria-invalid={Boolean(errors.service)} className={controlClass('service')} value={service} onChange={event => updateField('service', event.target.value, setService)} onBlur={() => blurField('service')}>
                <option value="">Select a service</option>{services.map(item => <option key={item}>{item}</option>)}
              </select>{fieldError('service')}
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">Job Date {required}
                <input ref={element => { fieldRefs.current.job_date = element; }} type="date" min={todayInBengaluru()} aria-invalid={Boolean(errors.job_date)} className={controlClass('job_date')} value={jobDate} onChange={event => {
                  setLoadingSlots(true);
                  setUnavailableSlots([]);
                  updateField('time_slot', '', setTimeSlot);
                  updateField('job_date', event.target.value, setJobDate);
                }} onBlur={() => blurField('job_date')} />
                {fieldError('job_date')}
              </label>
              <label className="block text-sm font-semibold text-slate-700">Time Slot {required}
                <select ref={element => { fieldRefs.current.time_slot = element; }} aria-invalid={Boolean(errors.time_slot)} className={controlClass('time_slot')} value={timeSlot} onChange={event => updateField('time_slot', event.target.value, setTimeSlot)} onBlur={() => blurField('time_slot')} disabled={loadingSlots}>
                  <option value="">{loadingSlots ? 'Loading slots…' : 'Select an available slot'}</option>
                  {TIME_SLOTS.map(slot => <option key={slot} value={slot} disabled={unavailableSlots.includes(slot)}>{slot}{unavailableSlots.includes(slot) ? ' — unavailable' : ''}</option>)}
                </select>{fieldError('time_slot')}
              </label>
            </div>
            <label className="block text-sm font-semibold text-slate-700">Service Address in Bangalore {required}
              <textarea ref={element => { fieldRefs.current.service_address = element; }} rows="2" aria-invalid={Boolean(errors.service_address)} className={controlClass('service_address')} value={address} onChange={event => updateField('service_address', event.target.value, setAddress)} onBlur={() => blurField('service_address')} placeholder="Street, area, landmark, Bengaluru" />
              {fieldError('service_address')}
            </label>
            <label className="block text-sm font-semibold text-slate-700">Work Description / Notes
              <textarea ref={element => { fieldRefs.current.work_description = element; }} rows="2" aria-invalid={Boolean(errors.work_description)} className={controlClass('work_description')} value={description} onChange={event => updateField('work_description', event.target.value, setDescription)} onBlur={() => blurField('work_description')} placeholder="Tell the employee what needs to be done" />
              {fieldError('work_description')}
            </label>
            <button type="submit" disabled={submitting || loadingSlots} className="w-full rounded-xl bg-violet-700 px-4 py-3 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-60">{submitting ? 'Confirming booking…' : 'Confirm Booking'}</button>
          </form>
        </>}
      </section>
    </div>
    <AuthModal isOpen={authOpen} initialMode="login" onClose={() => setAuthOpen(false)} onAuthenticated={result => {
      localStorage.setItem('urbab366_customer_token', result.token);
      window.dispatchEvent(new CustomEvent('urbab366-customer-authenticated', { detail: result.customer }));
      setAuthOpen(false);
      setServerError('');
    }} />
  </>;
}
