import React, { useState } from 'react';
import { Sparkles, Shield, Droplets, LayoutGrid, Gift } from 'lucide-react';

export default function FloatingDock({ activeTab, onTabClick }) {
  const tabs = [
    { id: 'uc', label: 'U366', icon: Shield, target: 'hero-section' },
    { id: 'beauty', label: 'Beauty', icon: Sparkles, target: 'salon_women' },
    { id: 'native', label: 'Native', icon: Droplets, target: 'native-banner' },
    { id: 'wall-panels', label: 'Wall Panels', icon: LayoutGrid, target: 'wall-panels-banner' },
    { id: 'rewards', label: 'Rewards', icon: Gift, target: 'most_booked' },
  ];

  const handleScroll = (tab) => {
    onTabClick(tab.id);
    const element = document.getElementById(tab.target);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-neutral-900/95 backdrop-blur-md text-white px-3 py-2 rounded-full shadow-2xl border border-neutral-700/50 flex items-center gap-1 sm:gap-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => handleScroll(tab)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isActive 
                ? 'bg-white text-neutral-900 shadow-md scale-105' 
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-violet-700' : 'text-neutral-400'}`} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
