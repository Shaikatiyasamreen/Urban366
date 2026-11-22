import React from 'react';

const NOTEWORTHY_ITEMS = [
  {
    title: 'Full Home / Room Cleaning',
    subtitle: 'Deep scrub & sanitization',
    tag: 'Bestseller',
    img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80',
    category: 'cleaning-pest-control'
  },
  {
    title: 'Statement design wall',
    subtitle: 'Acoustic & wood fluted panels',
    tag: 'New',
    img: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=300&q=80',
    category: 'wall-makeover'
  },
  {
    title: 'Living & Bedroom Cleaning',
    subtitle: 'Sofa, mattress & curtain steam',
    tag: 'Popular',
    img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80',
    category: 'cleaning-pest-control'
  },
  {
    title: 'Native Water Purifier',
    subtitle: '2-year zero filter change',
    tag: '2-yr warranty',
    img: 'https://images.unsplash.com/photo-1585670149967-b4f4da88cc9f?auto=format&fit=crop&w=300&q=80',
    category: 'native-water-purifier'
  },
  {
    title: 'Native Smart Locks',
    subtitle: 'Keyless biometric entry',
    tag: 'Trending',
    img: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=300&q=80',
    category: 'native-smart-locks'
  },
  {
    title: 'Stove Service & Repair',
    subtitle: 'Gas hob burner flame tune-up',
    tag: 'Fast Pro',
    img: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=300&q=80',
    category: 'ac-appliance-repair'
  },
  {
    title: 'Laptop Repair',
    subtitle: 'Screen, RAM & thermal paste',
    tag: 'Doorstep',
    img: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=300&q=80',
    category: 'ac-appliance-repair'
  },
  {
    title: 'Hair Studio for Women',
    subtitle: 'L’Oréal hair spa & keratin',
    tag: 'Luxe',
    img: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=300&q=80',
    category: 'womens-salon-spa'
  },
  {
    title: 'AC Service & Repair',
    subtitle: 'Powerjet 2x deep wash',
    tag: '₹499',
    img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=300&q=80',
    category: 'ac-appliance-repair'
  },
  {
    title: 'Pest Control (Roach & Ant)',
    subtitle: 'Bayer odorless gel treatment',
    tag: '100% Safe',
    img: 'https://images.unsplash.com/photo-1587582423116-ec07293f0395?auto=format&fit=crop&w=300&q=80',
    category: 'cleaning-pest-control'
  }
];

export default function NewAndNoteworthy({ onSelectCategory }) {
  return (
    <section className="py-8">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        <div className="mb-5">
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] lg:leading-[44px] font-semibold text-neutral-900 tracking-tight">
            New and noteworthy
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Recently launched innovations & popular seasonal services by Urbab366
          </p>
        </div>

        {/* 2 rows x 5 columns grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {NOTEWORTHY_ITEMS.map((item, idx) => (
            <div
              key={idx}
              onClick={() => onSelectCategory(item.category)}
              className="bg-[#F8F8F9] hover:bg-[#F2F2F4] border border-gray-100 rounded-2xl p-3 flex flex-col justify-between group cursor-pointer transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5 bg-gray-200">
                <img 
                  src={item.img} 
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                />
                {item.tag && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold bg-white/95 text-neutral-900 rounded-md shadow-sm uppercase tracking-wide">
                    {item.tag}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-neutral-900 leading-snug line-clamp-1 group-hover:text-violet-700 transition-colors">
                  {item.title}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
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
