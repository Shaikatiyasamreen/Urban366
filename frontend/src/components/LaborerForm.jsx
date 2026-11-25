import React, { useRef, useState } from 'react';

const SERVICE_OPTIONS = [
  'Carpenter', 'Plumber', 'Electrician', 'Painter', 'Mechanic', 'Technician',
  'Appliance Repair', 'AC Repair', 'Mason', 'Cleaning'
];
const LOCALITY_OPTIONS = [
  'Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Jayanagar',
  'Electronic City', 'Marathahalli', 'Hebbal', 'Richmond Town', 'Malleshwaram', 'Bellandur'
];
const EXPERTISE_OPTIONS = ['Fresher', 'Intermediate', 'Expert'];
const AVAILABILITY_OPTIONS = ['Available', 'Busy', 'Inactive'];
const APPROVAL_OPTIONS = ['Approved', 'Pending'];
const PHONE_PATTERN = /^[6-9]\d{9}$/;
const SERVICE_BY_CASEFOLD = new Map(SERVICE_OPTIONS.map(service => [service.toLowerCase(), service]));
const LOCALITY_BY_CASEFOLD = new Map(LOCALITY_OPTIONS.map(locality => [locality.toLowerCase(), locality]));

const EMPTY_WORKER = {
  name: '',
  phone: '',
  alternate_phone: '',
  service_categories: [],
  expertise_level: '',
  experience_years: '',
  full_address: '',
  preferred_localities: '',
  rate: '',
  languages_spoken: '',
  availability_status: 'Available',
  approval_status: 'Approved'
};

function workerServices(value) {
  if (Array.isArray(value)) return value.map(service => String(service));
  return String(value || '').split(',').map(service => service.trim()).filter(Boolean);
}

function localityValues(value) {
  if (Array.isArray(value)) return value.map(locality => String(locality).trim()).filter(Boolean);
  return String(value || '').split(',').map(locality => locality.trim()).filter(Boolean);
}

function validatePersonName(value) {
  const clean = typeof value === 'string' ? value.trim() : '';
  return /^[\p{L} ]+$/u.test(clean) && clean.replace(/\s+/g, '').length >= 2
    ? ''
    : "Enter worker's full name (min 2 letters).";
}

function validateWorkerField(field, value, form) {
  if (field === 'name') return validatePersonName(value);
  if (field === 'phone') {
    return typeof value === 'string' && PHONE_PATTERN.test(value)
      ? ''
      : 'Enter a valid 10-digit Indian mobile number.';
  }
  if (field === 'service_categories') {
    const services = Array.isArray(value) ? value : [];
    const distinct = new Set(services.map(service => typeof service === 'string' ? service.toLowerCase() : ''));
    return services.length >= 1
      && services.length <= 3
      && distinct.size === services.length
      && services.every(service => typeof service === 'string' && SERVICE_BY_CASEFOLD.has(service.toLowerCase()))
      ? ''
      : 'Select at least 1 service (maximum 3).';
  }
  if (field === 'expertise_level') {
    return EXPERTISE_OPTIONS.includes(value) ? '' : 'Select an expertise level.';
  }
  if (field === 'full_address') {
    const address = typeof value === 'string' ? value.trim() : '';
    return address.length >= 10 && /[\p{L}\d]/u.test(address)
      ? ''
      : 'Enter a complete street/area address (min 10 characters).';
  }
  if (field === 'preferred_localities') {
    const localities = localityValues(value);
    const distinct = new Set(localities.map(locality => locality.toLowerCase()));
    return localities.length > 0
      && distinct.size === localities.length
      && localities.every(locality => LOCALITY_BY_CASEFOLD.has(locality.toLowerCase()))
      ? ''
      : 'Select at least 1 Bangalore locality.';
  }
  if (field === 'alternate_phone') {
    if (value === '') return '';
    if (typeof value !== 'string' || !PHONE_PATTERN.test(value)) {
      return 'Enter a valid 10-digit Indian mobile number.';
    }
    return value === form.phone ? 'Alternate phone must be different from primary phone.' : '';
  }
  if (field === 'experience_years') {
    if (value === '') return '';
    const number = typeof value === 'number' || typeof value === 'string' ? Number(value) : NaN;
    return Number.isFinite(number) && number >= 0 && number <= 60
      ? ''
      : 'Enter valid experience between 0 and 60 years.';
  }
  if (field === 'rate') {
    if (value === '' || (typeof value === 'string' && !value.trim())) return '';
    if (typeof value === 'number') {
      return Number.isFinite(value) && value >= 0 ? '' : 'Enter a valid non-negative rate.';
    }
    if (typeof value !== 'string') return 'Enter a valid non-negative rate.';
    const match = /^(?:₹\s*)?([0-9]+(?:\.[0-9]+)?)(?:\s*\/\s*visit)?$/i.exec(value.trim());
    const number = match ? Number(match[1]) : NaN;
    return Number.isFinite(number) && number >= 0 ? '' : 'Enter a valid non-negative rate.';
  }
  if (field === 'languages_spoken') {
    return typeof value === 'string' ? '' : 'Enter languages as text.';
  }
  if (field === 'availability_status') {
    return AVAILABILITY_OPTIONS.includes(value) ? '' : 'Select a valid availability status.';
  }
  if (field === 'approval_status') {
    return APPROVAL_OPTIONS.includes(value) ? '' : 'Select a valid approval status.';
  }
  return '';
}

export default function LaborerForm({
  initialValue,
  onSubmit,
  onRequestError,
  submitting = false,
  admin = false,
  submitLabel
}) {
  const [form, setForm] = useState(() => {
    const initial = {
      ...EMPTY_WORKER,
      ...initialValue,
      service_categories: workerServices(initialValue?.service_categories || initialValue?.service_category),
      preferred_localities: localityValues(initialValue?.preferred_localities).join(', ')
    };
    ['name', 'phone', 'alternate_phone', 'expertise_level', 'experience_years',
      'full_address', 'rate', 'languages_spoken', 'availability_status', 'approval_status']
      .forEach(field => {
        if (initial[field] === null || initial[field] === undefined) initial[field] = EMPTY_WORKER[field];
      });
    return initial;
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const fieldRefs = useRef({});
  const selectedLocalities = localityValues(form.preferred_localities);
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(form.full_address || 'Bengaluru, Karnataka')}&output=embed`;
  const visibleFields = [
    'name', 'phone', 'service_categories', 'expertise_level', 'full_address',
    'preferred_localities', 'alternate_phone', 'experience_years', 'rate',
    'languages_spoken', ...(admin ? ['availability_status', ...(initialValue ? ['approval_status'] : [])] : [])
  ];

  const focusFirstInvalid = errors => {
    const field = visibleFields.find(item => errors[item]);
    const element = fieldRefs.current[field];
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const updateErrorsFor = (fields, nextForm, shouldValidate) => {
    if (!shouldValidate) return;
    setFieldErrors(current => {
      const next = { ...current };
      fields.forEach(field => {
        const error = validateWorkerField(field, nextForm[field], nextForm);
        if (error) next[field] = error;
        else delete next[field];
      });
      return next;
    });
  };

  const setField = (field, value) => {
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);
    updateErrorsFor(
      field === 'phone' ? ['phone', 'alternate_phone'] : [field],
      nextForm,
      submitted || touched[field]
    );
  };

  const blurField = field => {
    setTouched(current => ({ ...current, [field]: true }));
    updateErrorsFor([field], form, true);
  };

  const toggleService = service => {
    const existing = form.service_categories.find(item => item.toLowerCase() === service.toLowerCase());
    if (existing) {
      setField('service_categories', form.service_categories.filter(item => item.toLowerCase() !== service.toLowerCase()));
      return;
    }
    if (form.service_categories.length >= 3) {
      setTouched(current => ({ ...current, service_categories: true }));
      setFieldErrors(current => ({
        ...current,
        service_categories: 'Select at least 1 service (maximum 3).'
      }));
      return;
    }
    setField('service_categories', [...form.service_categories, service]);
  };

  const toggleLocality = locality => {
    const exists = selectedLocalities.some(value => value.toLowerCase() === locality.toLowerCase());
    const updated = exists
      ? selectedLocalities.filter(value => value.toLowerCase() !== locality.toLowerCase())
      : [...selectedLocalities, LOCALITY_BY_CASEFOLD.get(locality.toLowerCase())];
    setField('preferred_localities', updated.join(', '));
  };

  const validateAll = () => {
    const errors = {};
    visibleFields.forEach(field => {
      const error = validateWorkerField(field, form[field], form);
      if (error) errors[field] = error;
    });
    return errors;
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (submitting) return;
    setSubmitted(true);
    setTouched(current => ({ ...current, ...Object.fromEntries(visibleFields.map(field => [field, true])) }));
    const errors = validateAll();
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      focusFirstInvalid(errors);
      return;
    }

    try {
      await onSubmit({
        ...form,
        name: form.name.trim(),
        phone: form.phone,
        alternate_phone: form.alternate_phone,
        service_categories: form.service_categories,
        experience_years: form.experience_years === '' ? '' : Number(form.experience_years),
        full_address: form.full_address.trim(),
        preferred_localities: selectedLocalities.join(', '),
        rate: typeof form.rate === 'string' ? form.rate.trim() : form.rate,
        languages_spoken: form.languages_spoken.trim()
      });
    } catch (requestError) {
      const backendErrors = requestError.errors && typeof requestError.errors === 'object'
        ? requestError.errors
        : {};
      const recognizedErrors = Object.fromEntries(
        Object.entries(backendErrors).filter(([field]) => visibleFields.includes(field))
      );
      if (Object.keys(recognizedErrors).length) {
        setFieldErrors(current => ({ ...current, ...recognizedErrors }));
        setTouched(current => ({ ...current, ...Object.fromEntries(Object.keys(recognizedErrors).map(field => [field, true])) }));
        focusFirstInvalid(recognizedErrors);
        if (Object.keys(backendErrors).some(field => !visibleFields.includes(field))) {
          onRequestError?.(requestError.message || 'Please try again.');
        }
      } else if (requestError.status === 409 && /phone number/i.test(requestError.message || '')) {
        const duplicateError = 'A laborer with this phone number is already registered.';
        setFieldErrors(current => ({ ...current, phone: duplicateError }));
        setTouched(current => ({ ...current, phone: true }));
        focusFirstInvalid({ phone: duplicateError });
      } else {
        onRequestError?.(requestError.message || 'Could not save worker details. Please try again.');
      }
    }
  };

  const inputClass = field => [
    'w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2',
    fieldErrors[field]
      ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
      : 'border-slate-200 focus:border-violet-500 focus:ring-violet-100'
  ].join(' ');
  const labelClass = 'mb-1.5 block text-sm font-semibold text-slate-700';
  const fieldError = field => fieldErrors[field] && (
    <p className="text-red-500 text-xs mt-1">{fieldErrors[field]}</p>
  );
  const fieldsetClass = field => `rounded-xl border p-3 ${fieldErrors[field] ? 'border-red-500' : 'border-transparent'}`;

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className={labelClass}>Full Name <span className="text-red-500">*</span></span>
          <input ref={element => { fieldRefs.current.name = element; }} aria-invalid={Boolean(fieldErrors.name)} className={inputClass('name')} value={form.name} onChange={event => setField('name', event.target.value)} onBlur={() => blurField('name')} required />
          {fieldError('name')}
        </label>
        <label>
          <span className={labelClass}>Phone Number <span className="text-red-500">*</span></span>
          <input ref={element => { fieldRefs.current.phone = element; }} type="tel" inputMode="numeric" aria-invalid={Boolean(fieldErrors.phone)} className={inputClass('phone')} value={form.phone} onChange={event => setField('phone', event.target.value)} onBlur={() => blurField('phone')} required />
          {fieldError('phone')}
        </label>
        {admin && <label>
          <span className={labelClass}>Alternate Phone (Optional)</span>
          <input ref={element => { fieldRefs.current.alternate_phone = element; }} type="tel" inputMode="numeric" aria-invalid={Boolean(fieldErrors.alternate_phone)} className={inputClass('alternate_phone')} value={form.alternate_phone} onChange={event => setField('alternate_phone', event.target.value)} onBlur={() => blurField('alternate_phone')} />
          {fieldError('alternate_phone')}
        </label>}
      </div>

      <fieldset ref={element => { fieldRefs.current.service_categories = element; }} tabIndex="-1" aria-invalid={Boolean(fieldErrors.service_categories)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) blurField('service_categories'); }} className={fieldsetClass('service_categories')}>
        <legend className={labelClass}>Services (Select 1–3) <span className="text-red-500">*</span></legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SERVICE_OPTIONS.map(service => (
            <label key={service} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${form.service_categories.some(item => item.toLowerCase() === service.toLowerCase()) ? 'border-violet-400 bg-violet-50 text-violet-800' : 'border-slate-200 text-slate-700'}`}>
              <input type="checkbox" checked={form.service_categories.some(item => item.toLowerCase() === service.toLowerCase())} onChange={() => toggleService(service)} />
              {service}
            </label>
          ))}
          {form.service_categories.filter(service => !SERVICE_BY_CASEFOLD.has(String(service).toLowerCase())).map(service => (
            <button key={service} type="button" onClick={() => setField('service_categories', form.service_categories.filter(item => item !== service))} className="rounded-full border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">Remove invalid service: {service}</button>
          ))}
        </div>
        {fieldError('service_categories')}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <label>
          <span className={labelClass}>Expertise Level <span className="text-red-500">*</span></span>
          <select ref={element => { fieldRefs.current.expertise_level = element; }} aria-invalid={Boolean(fieldErrors.expertise_level)} className={inputClass('expertise_level')} value={form.expertise_level} onChange={event => setField('expertise_level', event.target.value)} onBlur={() => blurField('expertise_level')} required>
            <option value="">Select expertise</option>
            {EXPERTISE_OPTIONS.map(option => <option key={option}>{option}</option>)}
          </select>
          {fieldError('expertise_level')}
        </label>
        <label>
          <span className={labelClass}>Years of Experience (Optional)</span>
          <input ref={element => { fieldRefs.current.experience_years = element; }} aria-invalid={Boolean(fieldErrors.experience_years)} className={inputClass('experience_years')} type="number" min="0" max="60" step="any" value={form.experience_years} onChange={event => setField('experience_years', event.target.value)} onBlur={() => blurField('experience_years')} />
          {fieldError('experience_years')}
        </label>
        <label>
          <span className={labelClass}>Rate (Optional)</span>
          <input ref={element => { fieldRefs.current.rate = element; }} aria-invalid={Boolean(fieldErrors.rate)} className={inputClass('rate')} inputMode="decimal" value={form.rate} onChange={event => setField('rate', event.target.value)} onBlur={() => blurField('rate')} placeholder="500 or ₹500/visit" />
          {fieldError('rate')}
        </label>
      </div>

      <label className="block">
        <span className={labelClass}>Full Address <span className="text-red-500">*</span></span>
        <textarea ref={element => { fieldRefs.current.full_address = element; }} aria-invalid={Boolean(fieldErrors.full_address)} className={inputClass('full_address')} rows="2" value={form.full_address} onChange={event => setField('full_address', event.target.value)} onBlur={() => blurField('full_address')} required placeholder="Street, landmark, Bengaluru, Karnataka" />
        {fieldError('full_address')}
      </label>
      {form.full_address.trim() && <iframe title="Address map preview" className="h-44 w-full rounded-xl border border-slate-200" src={mapUrl} loading="lazy" />}

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset ref={element => { fieldRefs.current.preferred_localities = element; }} tabIndex="-1" aria-invalid={Boolean(fieldErrors.preferred_localities)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) blurField('preferred_localities'); }} className={fieldsetClass('preferred_localities')}>
          <legend className={labelClass}>Preferred Localities <span className="text-red-500">*</span><span className="ml-1 font-normal text-slate-500">(Select one or more)</span></legend>
          <div className="flex flex-wrap gap-2">
            {LOCALITY_OPTIONS.map(locality => {
              const selected = selectedLocalities.some(value => value.toLowerCase() === locality.toLowerCase());
              return <button key={locality} type="button" aria-pressed={selected} onClick={() => toggleLocality(locality)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${selected ? 'border-violet-500 bg-violet-100 text-violet-800' : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300'}`}>{locality}</button>;
            })}
          </div>
          {selectedLocalities.filter(locality => !LOCALITY_BY_CASEFOLD.has(locality.toLowerCase())).map(locality => (
            <button key={locality} type="button" onClick={() => setField('preferred_localities', selectedLocalities.filter(item => item !== locality).join(', '))} className="mt-2 mr-2 rounded-full border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">Remove invalid locality: {locality}</button>
          ))}
          {fieldError('preferred_localities')}
        </fieldset>
        <label>
          <span className={labelClass}>Languages Spoken (Optional)</span>
          <input ref={element => { fieldRefs.current.languages_spoken = element; }} aria-invalid={Boolean(fieldErrors.languages_spoken)} className={inputClass('languages_spoken')} value={form.languages_spoken} onChange={event => setField('languages_spoken', event.target.value)} onBlur={() => blurField('languages_spoken')} placeholder="Kannada, English, Hindi" />
          {fieldError('languages_spoken')}
        </label>
      </div>

      {admin && <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className={labelClass}>Availability</span>
          <select ref={element => { fieldRefs.current.availability_status = element; }} aria-invalid={Boolean(fieldErrors.availability_status)} className={inputClass('availability_status')} value={form.availability_status} onChange={event => setField('availability_status', event.target.value)} onBlur={() => blurField('availability_status')}>
            {AVAILABILITY_OPTIONS.map(option => <option key={option}>{option}</option>)}
          </select>
          {fieldError('availability_status')}
        </label>
        {initialValue && <label>
          <span className={labelClass}>Approval</span>
          <select ref={element => { fieldRefs.current.approval_status = element; }} aria-invalid={Boolean(fieldErrors.approval_status)} className={inputClass('approval_status')} value={form.approval_status} onChange={event => setField('approval_status', event.target.value)} onBlur={() => blurField('approval_status')}>
            {APPROVAL_OPTIONS.map(option => <option key={option}>{option}</option>)}
          </select>
          {fieldError('approval_status')}
        </label>}
      </div>}

      <button type="submit" disabled={submitting} className="w-full rounded-xl bg-violet-700 px-5 py-3 font-bold text-white hover:bg-violet-800 disabled:opacity-60 sm:w-auto">
        {submitting ? 'Saving…' : (submitLabel || 'Save worker')}
      </button>
    </form>
  );
}
