import React, { useState } from 'react';

const SERVICE_OPTIONS = [
  'Carpenter', 'Plumber', 'Electrician', 'Painter', 'Mechanic', 'Technician',
  'Appliance Repair', 'AC Repair', 'Mason', 'Cleaning'
];

const EMPTY_WORKER = {
  name: '',
  phone: '',
  alternate_phone: '',
  service_categories: [],
  expertise_level: 'Intermediate',
  experience_years: 0,
  full_address: '',
  preferred_localities: '',
  rate: '',
  languages_spoken: '',
  availability_status: 'Available',
  approval_status: 'Approved'
};

function workerServices(value) {
  if (Array.isArray(value)) return value;
  return String(value || '').split(',').map(service => service.trim()).filter(Boolean);
}

function normalizePhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length > 10) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length > 10) digits = digits.slice(1);
  return /^\d{10}$/.test(digits) ? digits : '';
}

export default function LaborerForm({ initialValue, onSubmit, submitting = false, admin = false, submitLabel }) {
  const [form, setForm] = useState(() => ({
    ...EMPTY_WORKER,
    ...initialValue,
    service_categories: workerServices(initialValue?.service_categories || initialValue?.service_category)
  }));
  const [formError, setFormError] = useState('');
  const setField = (field, value) => setForm(current => ({ ...current, [field]: value }));
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(form.full_address || 'Bengaluru, Karnataka')}&output=embed`;

  const toggleService = (service) => {
    const selected = form.service_categories;
    if (selected.includes(service)) {
      setField('service_categories', selected.filter(item => item !== service));
      setFormError('');
    } else if (selected.length < 3) {
      setField('service_categories', [...selected, service]);
      setFormError('');
    } else {
      setFormError('Choose no more than 3 services.');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (form.service_categories.length < 1 || form.service_categories.length > 3) {
      setFormError('Choose between 1 and 3 services.');
      return;
    }
    const phone = normalizePhone(form.phone);
    if (!phone) {
      setFormError('Enter a valid 10-digit Indian phone number.');
      return;
    }
    const alternatePhone = form.alternate_phone.trim() ? normalizePhone(form.alternate_phone) : '';
    if (form.alternate_phone.trim() && !alternatePhone) {
      setFormError('Enter a valid 10-digit alternate phone number or leave it blank.');
      return;
    }
    setFormError('');
    onSubmit({
      ...form,
      phone,
      alternate_phone: alternatePhone,
      service_categories: form.service_categories,
      experience_years: Number(form.experience_years)
    });
  };

  const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100';
  const labelClass = 'mb-1.5 block text-sm font-semibold text-slate-700';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{formError}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <label><span className={labelClass}>Full Name <span className="text-red-500">*</span></span><input className={inputClass} value={form.name} onChange={e => setField('name', e.target.value)} required /></label>
        <label><span className={labelClass}>Phone Number <span className="text-red-500">*</span></span><input className={inputClass} type="tel" inputMode="tel" value={form.phone} onChange={e => setField('phone', e.target.value)} required /></label>
        {admin && <label><span className={labelClass}>Alternate Phone (Optional)</span><input className={inputClass} type="tel" value={form.alternate_phone} onChange={e => setField('alternate_phone', e.target.value)} /></label>}
      </div>

      <fieldset>
        <legend className={labelClass}>Services (Select 1–3) <span className="text-red-500">*</span></legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SERVICE_OPTIONS.map(service => (
            <label key={service} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${form.service_categories.includes(service) ? 'border-violet-400 bg-violet-50 text-violet-800' : 'border-slate-200 text-slate-700'}`}>
              <input type="checkbox" checked={form.service_categories.includes(service)} onChange={() => toggleService(service)} />
              {service}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <label><span className={labelClass}>Expertise Level <span className="text-red-500">*</span></span><select className={inputClass} value={form.expertise_level} onChange={e => setField('expertise_level', e.target.value)} required><option>Fresher</option><option>Intermediate</option><option>Expert</option></select></label>
        <label><span className={labelClass}>Years of Experience (Optional)</span><input className={inputClass} type="number" min="0" value={form.experience_years} onChange={e => setField('experience_years', e.target.value)} /></label>
        <label><span className={labelClass}>Rate (Optional)</span><input className={inputClass} value={form.rate} onChange={e => setField('rate', e.target.value)} placeholder="₹500/visit" /></label>
      </div>

      <label className="block">
        <span className={labelClass}>Full Address <span className="text-red-500">*</span></span>
        <textarea className={inputClass} rows="2" value={form.full_address} onChange={e => setField('full_address', e.target.value)} required placeholder="Street, landmark, Bengaluru, Karnataka" />
      </label>
      {form.full_address.trim() && <iframe title="Address map preview" className="h-44 w-full rounded-xl border border-slate-200" src={mapUrl} loading="lazy" />}

      <div className="grid gap-4 sm:grid-cols-2">
        <label><span className={labelClass}>Preferred Localities <span className="text-red-500">*</span></span><input className={inputClass} value={form.preferred_localities} onChange={e => setField('preferred_localities', e.target.value)} required placeholder="Koramangala, Indiranagar, Whitefield" /></label>
        <label><span className={labelClass}>Languages Spoken (Optional)</span><input className={inputClass} value={form.languages_spoken} onChange={e => setField('languages_spoken', e.target.value)} placeholder="Kannada, English, Hindi" /></label>
      </div>

      {admin && <div className="grid gap-4 sm:grid-cols-2">
        <label><span className={labelClass}>Availability</span><select className={inputClass} value={form.availability_status} onChange={e => setField('availability_status', e.target.value)}><option>Available</option><option>Busy</option><option>Inactive</option></select></label>
        {initialValue && <label><span className={labelClass}>Approval</span><select className={inputClass} value={form.approval_status} onChange={e => setField('approval_status', e.target.value)}><option>Approved</option><option>Pending</option></select></label>}
      </div>}

      <button type="submit" disabled={submitting} className="w-full rounded-xl bg-violet-700 px-5 py-3 font-bold text-white hover:bg-violet-800 disabled:opacity-60 sm:w-auto">
        {submitting ? 'Saving…' : (submitLabel || 'Save worker')}
      </button>
    </form>
  );
}
