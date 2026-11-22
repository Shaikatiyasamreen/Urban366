import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

const BEAUTY_POSTERS = [
  {
    title: 'Luxury Ayurvedic Facials',
    tag: 'Holistic Skin Glow',
    desc: 'Kumkumadi oil, pure saffron mist & Kansa wand drainage massage.',
    bg: 'from-emerald-950 via-teal-900 to-green-950',
    img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80',
    category: 'womens-salon-spa'
  },
  {
    title: 'Japanese Bubble Facials',
    tag: 'Hydra Glow Tech',
    desc: 'Micro-bubble carbonation deep pore extraction & hyaluronic serum.',
    bg: 'from-rose-950 via-pink-900 to-violet-950',
    img: 'https://images.unsplash.com/photo-1512290900672-1f4806a6b579?auto=format&fit=crop&w=600&q=80',
    category: 'womens-salon-spa'
  },
  {
    title: 'Pain Relief Muscle Therapy',
    tag: 'Deep Tissue Relief',
    desc: 'Targeted trigger point knot release for IT neck, shoulders & spine.',
    bg: 'from-amber-950 via-stone-900 to-orange-950',
    img: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=600&q=80',
    category: 'spa_women'
  }
];

export default function BeautyPostersSection({ onSelectPoster }) {
  return (
    <section className="py-8">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] lg:leading-[42px] font-semibold text-neutral-900 tracking-tight">
              Trending in beauty
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Curated salon & spa rituals favored by Bengaluru residents
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {BEAUTY_POSTERS.map((poster, idx) => (
            <div
              key={idx}
              onClick={() => onSelectPoster(poster)}
              className={`rounded-2xl overflow-hidden relative shadow-lg group cursor-pointer bg-gradient-to-br ${poster.bg} min-h-[300px] flex flex-col justify-between p-6 text-white border border-white/10`}
            >
              <img 
                src={poster.img} 
                alt={poster.title}
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40 group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="relative z-10 flex items-center justify-between">
                <span className="px-2.5 py-1 text-[11px] font-bold bg-white/20 backdrop-blur-md rounded-md uppercase tracking-wider text-white">
                  {poster.tag}
                </span>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>

              <div className="relative z-10 mt-auto pt-6">
                <h3 className="text-xl sm:text-2xl font-bold leading-tight drop-shadow">
                  {poster.title}
                </h3>
                <p className="text-xs text-gray-300 mt-2 line-clamp-2 leading-relaxed">
                  {poster.desc}
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-amber-200 transition-colors">
                  <span>Explore Ritual</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
