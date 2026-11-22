import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Search, 
  User, 
  ShoppingCart, 
  ChevronDown, 
  X,
  Mic,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function Navbar({ 
  currentLocation, 
  onOpenLocationModal, 
  cart, 
  onOpenCart,
  onSelectService,
  allServices = [],
  onOpenVoiceSearch,
  searchQuery,
  setSearchQuery
}) {
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const q = searchQuery.toLowerCase();
      const filtered = allServices.filter(s => 
        s.title.toLowerCase().includes(q) || 
        (s.category_name && s.category_name.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q))
      ).slice(0, 6);
      setSearchResults(filtered);
      setShowSearchDropdown(true);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  }, [searchQuery, allServices]);

  // Click outside to close search dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className={`sticky top-0 z-40 bg-white/95 backdrop-blur-md transition-all duration-200 ${
      isScrolled ? 'shadow-md border-b border-slate-100' : 'border-b border-slate-100'
    }`}>
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-[76px] flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo & Location */}
        <div className="flex items-center gap-5 shrink-0">
          <a href="/" className="flex items-center gap-2.5 group">
            {/* Urbab366 Custom Monogram Logo */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-900 via-indigo-900 to-slate-900 flex items-center justify-center text-white font-extrabold shadow-md group-hover:shadow-violet-200 transition-all border border-violet-700/30">
              <span className="text-white text-sm tracking-tighter">U</span>
              <span className="text-emerald-400 text-xs font-black">366</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="font-black text-[20px] leading-tight text-slate-900 tracking-tight font-sans">
                  Urbab<span className="text-violet-600">366</span>
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-emerald-100 text-emerald-800 rounded uppercase tracking-wider">
                  366 Days
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider -mt-0.5">
                Bengaluru Hub
              </span>
            </div>
          </a>

          {/* Location Selector */}
          <button 
            onClick={onOpenLocationModal}
            className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full hover:bg-slate-100 transition-colors text-left max-w-[280px] lg:max-w-[340px] border border-slate-200"
            title="Change service location in Bengaluru"
          >
            <MapPin className="w-4 h-4 text-violet-600 shrink-0" />
            <div className="overflow-hidden">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {currentLocation?.area_name || 'Richmond Town'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </div>
              <p className="text-[11px] text-slate-500 truncate -mt-0.5">
                {currentLocation?.address_line || '3, Norris Rd, Bengaluru 560025'}
              </p>
            </div>
          </button>
        </div>

        {/* Center: Search Bar with Voice Search Button */}
        <div ref={searchRef} className="relative flex-1 max-w-[490px]">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim().length > 1 && setShowSearchDropdown(true)}
              placeholder="Search or voice search: 'Deep cleaning', 'AC service'..."
              className="w-full pl-10 pr-20 py-2.5 text-sm bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-violet-600 focus:ring-2 focus:ring-violet-100 rounded-xl outline-none transition-all placeholder:text-slate-400 text-slate-900 font-normal"
            />
            
            <div className="absolute right-2 flex items-center gap-1">
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Voice Search Trigger Button */}
              <button
                type="button"
                onClick={onOpenVoiceSearch}
                className="flex items-center gap-1 px-2 py-1 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-lg text-xs font-bold transition-all shadow-xs group/mic"
                title="Search with your voice"
              >
                <Mic className="w-3.5 h-3.5 text-violet-700 group-hover/mic:scale-110 transition-transform" />
                <span className="hidden sm:inline text-[11px]">Voice</span>
              </button>
            </div>
          </div>

          {/* Search Autocomplete Dropdown */}
          {showSearchDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
              <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Matching Services ({searchResults.length})</span>
                <span className="text-violet-600 font-semibold">Urbab366 Verified Pros</span>
              </div>
              {searchResults.length > 0 ? (
                <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectService(item);
                        setShowSearchDropdown(false);
                      }}
                      className="w-full text-left p-3 hover:bg-violet-50/50 flex items-center justify-between gap-3 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.image_url} 
                          alt={item.title}
                          className="w-12 h-12 rounded-xl object-cover shrink-0" 
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-violet-700 transition-colors">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span className="font-bold text-slate-900">★ {item.rating}</span>
                            <span>•</span>
                            <span>{item.duration_mins} mins</span>
                            <span>•</span>
                            <span className="font-extrabold text-violet-900">₹{item.price}</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-violet-600 group-hover:translate-x-1 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-slate-500">
                  No matching services found in Bengaluru. Try asking for "salon", "plumber", or "pest control".
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Profile & Cart Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <User className="w-4 h-4 text-slate-600" />
            <span>Account</span>
          </button>

          {/* Cart Pill */}
          <button 
            onClick={onOpenCart}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
              cart?.item_count > 0 
                ? 'bg-gradient-to-r from-violet-700 to-indigo-700 hover:from-violet-800 hover:to-indigo-800 text-white shadow-violet-200' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
          >
            <div className="relative">
              <ShoppingCart className="w-4 h-4" />
              {cart?.item_count > 0 && (
                <span className="absolute -top-2.5 -right-2.5 bg-rose-500 text-white font-extrabold text-[10px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                  {cart.item_count}
                </span>
              )}
            </div>
            {cart?.item_count > 0 ? (
              <span className="font-extrabold">₹{cart.total_amount}</span>
            ) : (
              <span className="hidden sm:inline">Cart</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
