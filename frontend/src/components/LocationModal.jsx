import React, { useState } from 'react';
import { X, MapPin, Navigation, Search, Check } from 'lucide-react';

export default function LocationModal({ 
  isOpen, 
  onClose, 
  locations = [], 
  currentLocation, 
  onSelectLocation 
}) {
  const [filterQuery, setFilterQuery] = useState('');

  if (!isOpen) return null;

  const filteredLocations = locations.filter(loc => 
    loc.area_name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    loc.locality.toLowerCase().includes(filterQuery.toLowerCase()) ||
    loc.pincode.includes(filterQuery)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Select your Bengaluru location</h3>
            <p className="text-xs text-gray-500 mt-0.5">Urbab366 verified pros available across all areas</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar inside modal */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search area, locality, or pincode..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-violet-600 focus:bg-white rounded-xl text-sm outline-none transition-all placeholder:text-gray-400"
              autoFocus
            />
          </div>

          {/* Current GPS Simulation Button */}
          <button 
            onClick={() => {
              if (locations.length > 0) {
                onSelectLocation(locations[0]);
                onClose();
              }
            }}
            className="w-full mt-3 flex items-center gap-3 p-3 bg-violet-50 hover:bg-violet-100/70 border border-violet-100 rounded-xl text-left transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-violet-700 text-white flex items-center justify-center shrink-0">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-violet-950">Use current location (GPS)</p>
              <p className="text-xs text-violet-700">Detect accurate address automatically</p>
            </div>
          </button>
        </div>

        {/* Location List */}
        <div className="overflow-y-auto p-3 divide-y divide-gray-50 flex-1">
          <p className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Popular Bengaluru Localities
          </p>
          {filteredLocations.map((loc) => {
            const isSelected = currentLocation?.id === loc.id;
            return (
              <button
                key={loc.id}
                onClick={() => {
                  onSelectLocation(loc);
                  onClose();
                }}
                className={`w-full text-left p-3 rounded-xl flex items-center justify-between gap-3 transition-colors ${
                  isSelected ? 'bg-violet-50/70' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-violet-700' : 'text-gray-400'}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-neutral-900">{loc.area_name}</span>
                      <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {loc.pincode}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{loc.locality}</p>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">{loc.address_line}</p>
                  </div>
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-violet-700 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
