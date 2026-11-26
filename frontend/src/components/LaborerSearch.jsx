import React, { useState } from 'react';
import { MapPin, Search, Phone, ExternalLink, Calendar } from 'lucide-react';
import { API_BASE } from '../config';
import LaborerBookingModal from './LaborerBookingModal';

const SERVICES = ['Carpenter', 'Plumber', 'Electrician', 'Painter', 'Mechanic', 'Technician', 'Appliance Repair', 'AC Repair', 'Mason', 'Cleaning'];

export default function LaborerSearch() {
  const [service, setService] = useState('');
  const [locality, setLocality] = useState('');
  const [expertise, setExpertise] = useState('');
  const [laborers, setLaborers] = useState([]);
  const [searchedService, setSearchedService] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [bookingWorker, setBookingWorker] = useState(null);
  const [bookingRequiresLogin, setBookingRequiresLogin] = useState(false);

  const beginBooking = worker => {
    setBookingRequiresLogin(!localStorage.getItem('urbab366_customer_token'));
    setBookingWorker(worker);
  };

  const search = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setHasSearched(true);
    setSearchedService(service);
    try {
      const params = new URLSearchParams({ service, locality });
      if (expertise) params.set('expertise', expertise);
      const response = await fetch(`${API_BASE}/laborers/search?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not search workers.');
      setLaborers(data);
    } catch (searchError) {
      setError(searchError.message || 'Could not reach the server.');
      setLaborers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-[1240px] px-4 py-12 sm:px-6" id="nearby-workers">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-violet-700">Local professionals</p>
        <h2 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">Find a worker nearby</h2>
        <p className="mt-2 text-sm text-slate-500">Search approved, available professionals by service and area.</p>
      </div>
      <form onSubmit={search} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_1fr_auto]">
        <label className="text-xs font-semibold text-slate-600">Service
          <select required value={service} onChange={e => setService(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm">
            <option value="">Select a service</option>{SERVICES.map(item => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">Locality / area
          <input required value={locality} onChange={e => setLocality(e.target.value)} placeholder="e.g. Koramangala, Indiranagar, Whitefield" className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" />
        </label>
        <label className="text-xs font-semibold text-slate-600">Expertise level
          <select value={expertise} onChange={e => setExpertise(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm">
            <option value="">Any level</option><option>Fresher</option><option>Intermediate</option><option>Expert</option>
          </select>
        </label>
        <button disabled={loading} className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-60"><Search size={16} />{loading ? 'Searching' : 'Search'}</button>
      </form>
      {error && <p role="alert" className="mt-4 text-sm text-rose-700">{error}</p>}
      {hasSearched && !loading && !error && laborers.length === 0 && <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No approved available workers found. Try another area or service.</p>}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {laborers.map(worker => {
          const services = worker.service_list || String(worker.service_categories || '').split(',').map(item => item.trim()).filter(Boolean);
          const mapSearch = worker.full_address || worker.preferred_localities || 'Bengaluru, Karnataka';
          const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapSearch)}&output=embed`;
          const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapSearch)}`;
          return <article key={worker.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="text-lg font-bold text-slate-900">{worker.name}</h3><span className="mt-1 inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-800">{worker.expertise_level} · {worker.experience_years} {worker.experience_years === 1 ? 'year' : 'years'}</span></div>
                <div className="flex flex-wrap gap-2">
                  <a href={`tel:${worker.phone}`} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white"><Phone size={16} /> Call</a>
                  <button type="button" onClick={() => beginBooking(worker)} className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-800"><Calendar size={16} /> Book Now</button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">{services.map(item => <span key={item} className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${item.toLowerCase() === searchedService.toLowerCase() ? 'border-violet-300 bg-violet-100 text-violet-900' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>{item}</span>)}</div>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                {worker.rate && <p className="font-bold text-slate-900">{worker.rate}</p>}
                {worker.languages_spoken && <p>Languages: {worker.languages_spoken}</p>}
                <p className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0 text-violet-600" />{worker.full_address || worker.preferred_localities || 'Bengaluru, Karnataka'}</p>
                <a href={mapsLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-violet-700">Open in Google Maps <ExternalLink size={14} /></a>
              </div>
            </div>
            <iframe title={`Map for ${worker.name}`} className="h-48 w-full border-t border-slate-100" src={mapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </article>;
        })}
      </div>
      {bookingWorker && <LaborerBookingModal worker={bookingWorker} searchedService={searchedService} requireLogin={bookingRequiresLogin} onClose={() => setBookingWorker(null)} />}
    </section>
  );
}
