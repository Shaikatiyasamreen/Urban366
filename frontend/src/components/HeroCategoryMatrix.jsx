import React from 'react';
import { 
  Sparkles, 
  UserCheck, 
  SprayCan, 
  Palette, 
  Paintbrush, 
  Wrench, 
  Hammer, 
  Grid, 
  Droplets, 
  Lock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

const ICON_MAP = {
  Sparkles: Sparkles,
  UserCheck: UserCheck,
  SprayCan: SprayCan,
  Palette: Palette,
  Paintbrush: Paintbrush,
  Wrench: Wrench,
  Hammer: Hammer,
  Grid: Grid,
  Droplets: Droplets,
  Lock: Lock
};

export default function HeroCategoryMatrix({ 
  regularCategories = [], 
  nativeCategories = [], 
  heroBanner, 
  promises = [],
  onSelectCategory,
  onBookBanner
}) {
  return (
    <section id="hero-section" className="pt-6 pb-10">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Category Grid */}
          <div className="lg:col-span-6 xl:col-span-6">
            <div className="mb-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                Expert services, on demand.
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Verified pros at your doorstep in Bengaluru
              </p>
            </div>

            {/* 4x2 Main Categories Grid */}
            <div className="grid grid-cols-4 gap-3 sm:gap-4">
              {regularCategories.map((cat) => {
                const IconComponent = ICON_MAP[cat.icon_type] || Sparkles;
                return (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.slug)}
                    className="flex flex-col items-center text-center p-2 rounded-2xl hover:bg-gray-50 transition-all group relative"
                  >
                    {cat.badge && (
                      <span className="absolute -top-1.5 right-1 px-1.5 py-0.5 text-[10px] font-bold bg-violet-700 text-white rounded-full uppercase tracking-wider shadow-sm z-10">
                        {cat.badge}
                      </span>
                    )}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#F7F7F8] group-hover:bg-[#EFEFEF] group-hover:scale-105 flex items-center justify-center transition-all shadow-sm border border-gray-100">
                      <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-neutral-800 group-hover:text-violet-700 transition-colors" />
                    </div>
                    <span className="mt-2 text-xs sm:text-[13px] font-semibold text-neutral-800 group-hover:text-violet-700 transition-colors line-clamp-2 leading-tight">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Native Smart Products Row */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Native by Urbab366
                </span>
                <span className="text-[11px] font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">
                  Smart living
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {nativeCategories.map((native) => {
                  const IconComp = ICON_MAP[native.icon_type] || Droplets;
                  return (
                    <button
                      key={native.id}
                      onClick={() => onSelectCategory(native.slug)}
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-neutral-50 hover:from-violet-50 hover:to-indigo-50 border border-gray-200/80 rounded-xl transition-all group text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-gray-100">
                        <IconComp className="w-5 h-5 text-violet-700 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
                            {native.name}
                          </p>
                        </div>
                        {native.badge && (
                          <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded mt-0.5">
                            {native.badge}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Hero Banner + Our Promises */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col gap-5">
            {/* Hero Banner */}
            {heroBanner && (
              <div className="relative rounded-2xl overflow-hidden shadow-lg bg-gradient-to-r from-violet-700 via-indigo-600 to-emerald-500 text-white min-h-[220px] sm:min-h-[240px] flex items-center">
                {/* Background Image with Gradient Overlay */}
                <img 
                  src={heroBanner.image_url} 
                  alt={heroBanner.title}
                  className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30" 
                />
                <div className="relative z-10 p-6 sm:p-8 max-w-[420px]">
                  {heroBanner.eyebrow && (
                    <span className="inline-block px-2.5 py-1 text-xs font-bold bg-white/20 backdrop-blur-md rounded-md uppercase tracking-wider mb-2 text-white">
                      {heroBanner.eyebrow}
                    </span>
                  )}
                  <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight text-white drop-shadow-sm">
                    {heroBanner.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-emerald-100 mt-2 font-medium">
                    {heroBanner.subtitle}
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <button 
                      onClick={() => onBookBanner(heroBanner)}
                      className="px-5 py-2.5 bg-white text-neutral-900 hover:bg-neutral-100 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 group"
                    >
                      <span>{heroBanner.cta_text}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                    {heroBanner.badge && (
                      <span className="text-xs font-semibold text-white/90 bg-black/20 px-3 py-2 rounded-xl backdrop-blur-sm">
                        {heroBanner.badge}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Our Promises (Trust & Safety Badges) */}
            <div className="bg-[#F5F3FF] border border-violet-100/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-violet-700" />
                <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
                  Our Promises to Bengaluru
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {promises.map((p, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-neutral-900 leading-snug">
                        {p.title}
                      </p>
                      <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                        {p.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
