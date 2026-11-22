import React from 'react';
import { 
  X, 
  Star, 
  Clock, 
  ShieldCheck, 
  CheckCircle, 
  Plus, 
  Minus,
  Sparkles 
} from 'lucide-react';

export default function ServiceDetailModal({ 
  service, 
  isOpen, 
  onClose, 
  quantityInCart = 0,
  onAddToCart,
  onUpdateQuantity 
}) {
  if (!isOpen || !service) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Image & Header */}
        <div className="relative h-56 sm:h-64 bg-gray-100 shrink-0">
          <img 
            src={service.image_url} 
            alt={service.title}
            className="w-full h-full object-cover" 
          />
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {service.is_luxe && (
            <span className="absolute top-3 left-3 px-3 py-1 text-xs font-black uppercase tracking-widest text-[#2E2200] bg-gradient-to-r from-[#E6CA65] via-[#D4AF37] to-[#C5A059] rounded-md shadow-lg">
              LUXE EXPERIENCE
            </span>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-violet-700 uppercase tracking-wider mb-1">
              <span>{service.category_name || 'Home Service'}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 leading-tight">
              {service.title}
            </h3>

            {/* Meta */}
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
              <span className="inline-flex items-center gap-1 font-bold text-neutral-900 bg-gray-100 px-2 py-0.5 rounded">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{service.rating}</span>
              </span>
              <span>({service.review_count} verified reviews)</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>{service.duration_mins} mins</span>
              </span>
            </div>
          </div>

          {/* Description */}
          {service.description && (
            <p className="text-sm text-gray-600 leading-relaxed">
              {service.description}
            </p>
          )}

          {/* Features Included */}
          {service.feature_list && service.feature_list.length > 0 && (
            <div className="pt-2">
              <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-2">
                What's included in Bengaluru:
              </h4>
              <div className="space-y-2">
                {service.feature_list.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-neutral-700">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Urbab366 Promises */}
          <div className="bg-violet-50/50 p-3.5 rounded-xl border border-violet-100 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-violet-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-neutral-900">
                Urbab366 Bengaluru Guarantee
              </p>
              <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
                Verified background-checked professional with high-grade sanitized tools and 366-day service assurance.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer / Add to Cart */}
        <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-neutral-900">
                ₹{service.price}
              </span>
              {service.original_price && (
                <span className="text-sm text-gray-400 line-through">
                  ₹{service.original_price}
                </span>
              )}
            </div>
            <span className="text-[11px] text-gray-400">Total payable per session</span>
          </div>

          <div>
            {quantityInCart > 0 ? (
              <div className="flex items-center border-2 border-violet-600 bg-violet-50 rounded-xl px-2 py-1.5 text-violet-700 shadow-sm">
                <button 
                  onClick={() => onUpdateQuantity(service.id, -1)}
                  className="w-7 h-7 flex items-center justify-center hover:bg-violet-200/60 rounded-lg text-violet-800 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold text-sm">
                  {quantityInCart}
                </span>
                <button 
                  onClick={() => onUpdateQuantity(service.id, 1)}
                  className="w-7 h-7 flex items-center justify-center hover:bg-violet-200/60 rounded-lg text-violet-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onAddToCart(service)}
                className="px-6 py-2.5 bg-violet-700 hover:bg-violet-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
