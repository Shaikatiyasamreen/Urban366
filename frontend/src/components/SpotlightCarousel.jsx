import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

export default function SpotlightCarousel({ spotlightBanners = [], onBannerClick }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-8">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        {/* Header with Navigation Arrows */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-[36px] lg:leading-[44px] font-semibold text-neutral-900 tracking-tight">
              In the spotlight
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Top curated picks & exclusive deals for your home by Urbab366
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-neutral-700 shadow-sm transition-all"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center text-neutral-700 shadow-sm transition-all"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Carousel Row */}
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth snap-x snap-mandatory"
        >
          {spotlightBanners.map((banner) => (
            <div
              key={banner.id}
              onClick={() => onBannerClick(banner)}
              className="shrink-0 w-[300px] sm:w-[360px] md:w-[390px] h-[220px] rounded-2xl overflow-hidden relative shadow-md group cursor-pointer snap-start"
            >
              <img 
                src={banner.image_url} 
                alt={banner.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              {/* Card Content */}
              <div className="absolute inset-0 p-5 flex flex-col justify-between text-white z-10">
                <div className="flex items-center justify-between">
                  {banner.badge && (
                    <span className="px-2.5 py-1 text-[11px] font-bold bg-white text-neutral-900 rounded-md shadow uppercase tracking-wide">
                      {banner.badge}
                    </span>
                  )}
                  {banner.eyebrow && (
                    <span className="text-xs font-semibold text-gray-300 drop-shadow">
                      {banner.eyebrow}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-bold leading-snug drop-shadow-sm text-white">
                    {banner.title}
                  </h3>
                  <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                    {banner.subtitle}
                  </p>
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-violet-300 transition-colors">
                    <span>{banner.cta_text}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
