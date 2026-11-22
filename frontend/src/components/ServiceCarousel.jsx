import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import ServiceCard from './ServiceCard';

export default function ServiceCarousel({ 
  section, 
  cartItems = [], 
  onAddToCart, 
  onUpdateQuantity,
  onCardClick,
  onSeeAll 
}) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const getQuantityInCart = (serviceId) => {
    const item = cartItems.find(it => it.id === serviceId);
    return item ? item.quantity : 0;
  };

  if (!section || !section.services || section.services.length === 0) {
    return null;
  }

  return (
    <section id={section.id} className="py-7 scroll-mt-20">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] lg:leading-[42px] font-semibold text-neutral-900 tracking-tight">
              {section.title}
            </h2>
            {section.subtitle && (
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {section.subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {section.see_all_link && (
              <button
                onClick={() => onSeeAll(section)}
                className="hidden sm:flex items-center gap-1 text-xs sm:text-sm font-semibold text-violet-700 hover:text-violet-800 mr-2 group"
              >
                <span>See all</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            <button
              onClick={() => scroll('left')}
              className="w-9 h-9 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-neutral-700 shadow-sm transition-all"
              aria-label="Previous services"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-9 h-9 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-neutral-700 shadow-sm transition-all"
              aria-label="Next services"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Carousel */}
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth snap-x snap-mandatory"
        >
          {section.services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              quantityInCart={getQuantityInCart(service.id)}
              onAddToCart={onAddToCart}
              onUpdateQuantity={onUpdateQuantity}
              onCardClick={onCardClick}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
