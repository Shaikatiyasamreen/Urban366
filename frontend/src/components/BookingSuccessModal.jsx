import React from 'react';
import { CheckCircle2, Calendar, MapPin, ShieldCheck, X } from 'lucide-react';

export default function BookingSuccessModal({ bookingResult, isOpen, onClose }) {
  if (!isOpen || !bookingResult) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 p-6 sm:p-8 text-center relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h3 className="text-2xl font-extrabold text-neutral-900 tracking-tight">
          Booking Confirmed!
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          A verified Urbab366 professional has been assigned
        </p>

        {/* Details Card */}
        <div className="mt-6 bg-gray-50 rounded-2xl p-4 text-left border border-gray-100 space-y-2.5 text-xs text-neutral-700">
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="text-gray-500">Booking ID:</span>
            <span className="font-mono font-bold text-violet-700">#U366-BLR-{bookingResult.booking_id || '9823'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-600 shrink-0" />
            <span className="font-medium">Slot: Today / Scheduled Time</span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{bookingResult.message || 'Richmond Town, Bengaluru'}</span>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-gray-200 text-emerald-700 font-semibold">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>366-Day quality guarantee activated</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-neutral-900 hover:bg-black text-white font-bold text-sm rounded-xl shadow-md transition-all"
        >
          Done & Return to Home
        </button>
      </div>
    </div>
  );
}
