import React from 'react';

export default function PopularTags({ popularTags = [], onSelectTag }) {
  if (!popularTags || popularTags.length === 0) return null;

  return (
    <section className="py-6">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <h3 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight mb-4">
          Popular services in Bangalore
        </h3>
        <div className="flex flex-wrap gap-2.5">
          {popularTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => onSelectTag(tag)}
              className="px-4 py-2 bg-white hover:bg-violet-50 hover:text-violet-700 border border-gray-200 hover:border-violet-300 rounded-full text-xs sm:text-[13px] font-medium text-neutral-800 transition-all shadow-sm hover:scale-[1.02]"
            >
              {tag.tag_name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
