import React from 'react';
import { Play } from 'lucide-react';

export default function CurationsSection({ curations = [], onSelectCuration }) {
  if (!curations || curations.length === 0) return null;

  return (
    <section className="py-8">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="mb-5">
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] lg:leading-[42px] font-semibold text-neutral-900 tracking-tight">
            Thoughtful curations
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            of our finest experiences designed for everyday luxury by Urbab366
          </p>
        </div>

        {/* 4 Story / Reel Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
          {curations.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectCuration(item)}
              className="relative aspect-[9/14] rounded-2xl overflow-hidden shadow-md group cursor-pointer border border-gray-100"
            >
              <img 
                src={item.image_url} 
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

              {/* Play Badge Icon */}
              <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center text-white shadow group-hover:scale-110 group-hover:bg-violet-700 transition-all">
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </div>

              {/* Category pill */}
              <div className="absolute top-3 left-3">
                <span className="px-2 py-0.5 text-[10px] font-bold bg-black/40 backdrop-blur-md text-white rounded-md uppercase tracking-wider">
                  {item.category}
                </span>
              </div>

              {/* Bottom Text */}
              <div className="absolute bottom-0 inset-x-0 p-4 text-white">
                <h4 className="text-base sm:text-lg font-extrabold tracking-tight drop-shadow-sm leading-snug">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                  {item.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
