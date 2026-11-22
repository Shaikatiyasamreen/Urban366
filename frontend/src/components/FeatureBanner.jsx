import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function FeatureBanner({ banner, onAction }) {
  if (!banner) return null;

  const isBranded = banner.type === 'branded';
  const isWallPanels = banner.title?.toLowerCase().includes('statement');

  return (
    <div id={isWallPanels ? 'wall-panels-banner' : isBranded ? 'native-banner' : undefined} className="py-6 scroll-mt-20">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <div 
          className={`rounded-3xl overflow-hidden relative shadow-md border ${
            isBranded 
              ? 'bg-gradient-to-r from-violet-950 via-neutral-900 to-indigo-950 text-white border-violet-900/40' 
              : isWallPanels
              ? 'bg-gradient-to-r from-amber-50 via-stone-50 to-orange-50 text-neutral-900 border-amber-100'
              : 'bg-gradient-to-r from-violet-50 via-indigo-50 to-emerald-50 text-neutral-900 border-violet-100'
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 items-center">
            {/* Left Copy */}
            <div className="p-6 sm:p-10 md:p-12 md:col-span-7 z-10">
              <div className="flex items-center gap-2 mb-3">
                {banner.badge && (
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-md uppercase tracking-wider ${
                    isBranded 
                      ? 'bg-emerald-400 text-neutral-950' 
                      : 'bg-violet-700 text-white shadow-sm'
                  }`}>
                    {banner.badge}
                  </span>
                )}
                {banner.eyebrow && (
                  <span className={`text-xs font-semibold uppercase tracking-wider ${isBranded ? 'text-gray-300' : 'text-gray-500'}`}>
                    {banner.eyebrow}
                  </span>
                )}
              </div>

              <h3 className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight ${isBranded ? 'text-white' : 'text-neutral-900'}`}>
                {banner.title}
              </h3>

              <p className={`mt-2.5 text-sm sm:text-base leading-relaxed max-w-lg ${isBranded ? 'text-gray-300' : 'text-gray-600'}`}>
                {banner.subtitle}
              </p>

              <div className="mt-6 flex items-center gap-4">
                <button
                  onClick={() => onAction(banner)}
                  className={`px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 group ${
                    isBranded 
                      ? 'bg-white text-neutral-900 hover:bg-neutral-100' 
                      : 'bg-neutral-900 hover:bg-black text-white'
                  }`}
                >
                  <span>{banner.cta_text || 'Book now'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <span className={`text-xs font-semibold ${isBranded ? 'text-emerald-300' : 'text-violet-700'}`}>
                  ✨ Urbab366 Bengaluru Verified
                </span>
              </div>
            </div>

            {/* Right Image */}
            <div className="md:col-span-5 h-[220px] sm:h-[280px] md:h-full relative overflow-hidden">
              <img 
                src={banner.image_url} 
                alt={banner.title}
                className="w-full h-full object-cover object-center" 
              />
              <div className={`absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r ${
                isBranded 
                  ? 'from-violet-950 via-transparent to-transparent' 
                  : isWallPanels
                  ? 'from-amber-50 via-transparent to-transparent'
                  : 'from-violet-50 via-transparent to-transparent'
              }`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
