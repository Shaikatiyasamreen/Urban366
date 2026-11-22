import React from 'react';
import { Star, Clock, Plus, Minus } from 'lucide-react';

export default function ServiceCard({ 
  service, 
  quantityInCart = 0, 
  onAddToCart, 
  onUpdateQuantity,
  onCardClick 
}) {
  return (
    <div 
      className="shrink-0 w-[220px] sm:w-[233px] bg-white rounded-2xl flex flex-col justify-between service-card p-2 border border-gray-100/80 cursor-pointer group snap-start"
      onClick={() => onCardClick(service)}
    >
      <div>
        {/* Card Image Container */}
        <div className="relative w-full h-[160px] sm:h-[175px] rounded-xl overflow-hidden bg-gray-100">
          <img 
            src={service.image_url} 
            alt={service.title}
            className="w-full h-full object-cover img-zoom" 
          />
          {/* Luxe Gold Badge */}
          {service.is_luxe ? (
            <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-[#2E2200] bg-gradient-to-r from-[#E6CA65] via-[#D4AF37] to-[#C5A059] rounded-md shadow-md">
              LUXE
            </span>
          ) : null}

          {/* Discount Badge if any */}
          {service.original_price && (
            <span className="absolute top-2.5 right-2.5 px-2 py-0.5 text-[10px] font-bold text-white bg-rose-500 rounded-md shadow-sm">
              {Math.round(((service.original_price - service.price) / service.original_price) * 100)}% OFF
            </span>
          )}
        </div>

        {/* Content Info */}
        <div className="pt-3 px-1">
          {/* Title */}
          <h4 className="text-[15px] font-semibold text-neutral-900 group-hover:text-violet-700 transition-colors line-clamp-1 leading-snug">
            {service.title}
          </h4>

          {/* Rating, Reviews & Duration */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
            <span className="inline-flex items-center gap-0.5 font-bold text-neutral-900">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{service.rating}</span>
            </span>
            <span className="text-gray-400">({service.review_count})</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
              <Clock className="w-3 h-3 text-gray-400" />
              <span>{service.duration_mins} mins</span>
            </span>
          </div>
        </div>
      </div>

      {/* Pricing & Add Button Footer */}
      <div className="pt-3 px-1 mt-2 border-t border-gray-50 flex items-center justify-between gap-2">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-neutral-900">
              ₹{service.price}
            </span>
            {service.original_price && (
              <span className="text-xs text-gray-400 line-through">
                ₹{service.original_price}
              </span>
            )}
          </div>
          <span className="text-[10px] text-gray-400 block -mt-0.5">
            Starts at ₹{service.price}
          </span>
        </div>

        {/* Add / Stepper Button */}
        <div onClick={(e) => e.stopPropagation()}>
          {quantityInCart > 0 ? (
            <div className="flex items-center border border-violet-600 bg-violet-50 rounded-lg px-1.5 py-1 text-violet-700 shadow-sm">
              <button 
                onClick={() => onUpdateQuantity(service.id, -1)}
                className="w-5 h-5 flex items-center justify-center hover:bg-violet-200/60 rounded text-violet-800 transition-colors"
                title="Decrease"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 text-center font-bold text-xs">
                {quantityInCart}
              </span>
              <button 
                onClick={() => onUpdateQuantity(service.id, 1)}
                className="w-5 h-5 flex items-center justify-center hover:bg-violet-200/60 rounded text-violet-800 transition-colors"
                title="Increase"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => onAddToCart(service)}
              className="px-4 py-1.5 border border-violet-600 bg-white hover:bg-violet-50 text-violet-700 font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1 group/btn"
            >
              <Plus className="w-3.5 h-3.5 group-hover/btn:rotate-90 transition-transform" />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
