import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroCategoryMatrix from './components/HeroCategoryMatrix';
import FloatingDock from './components/FloatingDock';
import SpotlightCarousel from './components/SpotlightCarousel';
import NewAndNoteworthy from './components/NewAndNoteworthy';
import ServiceCarousel from './components/ServiceCarousel';
import FeatureBanner from './components/FeatureBanner';
import CurationsSection from './components/CurationsSection';
import BeautyPostersSection from './components/BeautyPostersSection';
import SeoDescription from './components/SeoDescription';
import PopularTags from './components/PopularTags';
import Footer from './components/Footer';
import LocationModal from './components/LocationModal';
import CartDrawer from './components/CartDrawer';
import ServiceDetailModal from './components/ServiceDetailModal';
import BookingSuccessModal from './components/BookingSuccessModal';
import VoiceSearchModal from './components/VoiceSearchModal';

const API_BASE = 'http://localhost:8000/api';

export default function App() {
  const [homepageData, setHomepageData] = useState(null);
  const [locations, setLocations] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [cart, setCart] = useState({ items: [], item_count: 0, total_amount: 0, discount: 0 });

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [activeDockTab, setActiveDockTab] = useState('uc');
  const [loading, setLoading] = useState(true);

  // Voice Search state
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [homeRes, locRes, cartRes] = await Promise.all([
          fetch(`${API_BASE}/homepage`),
          fetch(`${API_BASE}/locations`),
          fetch(`${API_BASE}/cart`)
        ]);
        if (homeRes.ok) {
          const homeJson = await homeRes.json();
          setHomepageData(homeJson);
          if (homeJson.default_location) setCurrentLocation(homeJson.default_location);
        }
        if (locRes.ok) {
          const locJson = await locRes.json();
          setLocations(locJson);
          if (!currentLocation && locJson.length > 0) setCurrentLocation(locJson[0]);
        }
        if (cartRes.ok) setCart(await cartRes.json());
      } catch (err) {
        console.error('Urbab366 backend fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleAddToCart = async (service) => {
    try {
      const res = await fetch(`${API_BASE}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: service.id, quantity: 1 })
      });
      if (res.ok) setCart(await res.json());
    } catch (err) { console.error('Cart add failed:', err); }
  };

  const handleUpdateQuantity = async (serviceId, delta) => {
    try {
      const res = await fetch(`${API_BASE}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: serviceId, quantity: delta })
      });
      if (res.ok) setCart(await res.json());
    } catch (err) { console.error('Cart update failed:', err); }
  };

  const handleRemoveFromCart = async (serviceId) => {
    try {
      const res = await fetch(`${API_BASE}/cart/${serviceId}`, { method: 'DELETE' });
      if (res.ok) setCart(await res.json());
    } catch (err) { console.error('Cart remove failed:', err); }
  };

  const handleSelectService = (service) => {
    setSelectedService(service);
    setIsServiceModalOpen(true);
  };

  const handleSelectCategory = (categorySlug) => {
    const sectionMap = {
      'womens-salon-spa': 'salon_women',
      'mens-salon-massage': 'salon_men',
      'cleaning-pest-control': 'cleaning_essentials',
      'ac-appliance-repair': 'appliance_repair',
      'electrician-plumber-carpenter': 'home_repairs',
      'native-water-purifier': 'native-banner',
      'wall-makeover': 'wall-panels-banner',
      'native-smart-locks': 'native-banner'
    };
    const targetId = sectionMap[categorySlug] || 'most_booked';
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Voice search callback: populate the search bar
  const handleVoiceResult = (voiceText) => {
    setSearchQuery(voiceText);
  };

  const allServices = homepageData?.sections?.flatMap(s => s.services) || [];
  const bathroomBanner = homepageData?.feature_banners?.find(b => b.type === 'feature' && (b.title.includes('bathroom') || b.title.includes('Bathroom') || b.title.includes('Sparkling') || b.title.includes('Glow')));
  const nativeM2Banner = homepageData?.feature_banners?.find(b => b.type === 'branded');
  const wallPanelsBanner = homepageData?.feature_banners?.find(b => b.title.includes('Wall') || b.title.includes('walls') || b.title.includes('Acoustic'));
  const getSection = (id) => homepageData?.sections?.find(s => s.id === id);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-900 to-indigo-900 flex items-center justify-center text-white font-extrabold text-lg animate-pulse shadow-lg">
          <span className="text-white">U</span>
          <span className="text-emerald-400 text-sm">366</span>
        </div>
        <p className="mt-4 text-sm font-bold text-slate-500">Loading Urbab366 Bengaluru...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-violet-100 selection:text-violet-900">
      <Navbar
        currentLocation={currentLocation}
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        cart={cart}
        onOpenCart={() => setIsCartOpen(true)}
        onSelectService={handleSelectService}
        allServices={allServices}
        onOpenVoiceSearch={() => setIsVoiceSearchOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <FloatingDock activeTab={activeDockTab} onTabClick={setActiveDockTab} />

      <main className="flex-1">
        <HeroCategoryMatrix
          regularCategories={homepageData?.regular_categories || []}
          nativeCategories={homepageData?.native_categories || []}
          heroBanner={homepageData?.hero_banner}
          promises={homepageData?.promises || []}
          onSelectCategory={handleSelectCategory}
          onBookBanner={() => document.getElementById('spa_women')?.scrollIntoView({ behavior: 'smooth' })}
        />

        <SpotlightCarousel
          spotlightBanners={homepageData?.spotlight_banners || []}
          onBannerClick={(banner) => {
            const target = banner.title.includes('Bathroom') || banner.title.includes('Stain') ? 'cleaning_essentials'
              : banner.title.includes('Massage') || banner.title.includes('Stress') ? 'massage_men'
              : banner.title.includes('RO') || banner.title.includes('Pure') ? 'native-banner'
              : 'cleaning_essentials';
            document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        <NewAndNoteworthy onSelectCategory={handleSelectCategory} />

        <ServiceCarousel section={getSection('most_booked')} cartItems={cart.items} onAddToCart={handleAddToCart} onUpdateQuantity={handleUpdateQuantity} onCardClick={handleSelectService} onSeeAll={() => {}} />

        <CurationsSection
          curations={homepageData?.curations || []}
          onSelectCuration={(c) => {
            const t = c.title.includes('Wall') || c.title.includes('Architect') ? 'wall-panels-banner'
              : c.title.includes('Groom') || c.title.includes('Gentle') ? 'salon_men'
              : c.title.includes('Spa') || c.title.includes('Candle') ? 'spa_women'
              : 'home_repairs';
            document.getElementById(t)?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {bathroomBanner && <FeatureBanner banner={bathroomBanner} onAction={() => document.getElementById('cleaning_essentials')?.scrollIntoView({ behavior: 'smooth' })} />}

        <ServiceCarousel section={getSection('cleaning_essentials')} cartItems={cart.items} onAddToCart={handleAddToCart} onUpdateQuantity={handleUpdateQuantity} onCardClick={handleSelectService} onSeeAll={() => {}} />

        <BeautyPostersSection onSelectPoster={() => document.getElementById('salon_women')?.scrollIntoView({ behavior: 'smooth' })} />

        <ServiceCarousel section={getSection('salon_women')} cartItems={cart.items} onAddToCart={handleAddToCart} onUpdateQuantity={handleUpdateQuantity} onCardClick={handleSelectService} onSeeAll={() => {}} />
        <ServiceCarousel section={getSection('spa_women')} cartItems={cart.items} onAddToCart={handleAddToCart} onUpdateQuantity={handleUpdateQuantity} onCardClick={handleSelectService} onSeeAll={() => {}} />

        {nativeM2Banner && <FeatureBanner banner={nativeM2Banner} onAction={() => { const p = allServices.find(s => s.title.includes('Purifier')); if (p) handleSelectService(p); }} />}

        <ServiceCarousel section={getSection('appliance_repair')} cartItems={cart.items} onAddToCart={handleAddToCart} onUpdateQuantity={handleUpdateQuantity} onCardClick={handleSelectService} onSeeAll={() => {}} />

        {wallPanelsBanner && <FeatureBanner banner={wallPanelsBanner} onAction={() => document.getElementById('home_repairs')?.scrollIntoView({ behavior: 'smooth' })} />}

        <ServiceCarousel section={getSection('home_repairs')} cartItems={cart.items} onAddToCart={handleAddToCart} onUpdateQuantity={handleUpdateQuantity} onCardClick={handleSelectService} onSeeAll={() => {}} />
        <ServiceCarousel section={getSection('massage_men')} cartItems={cart.items} onAddToCart={handleAddToCart} onUpdateQuantity={handleUpdateQuantity} onCardClick={handleSelectService} onSeeAll={() => {}} />
        <ServiceCarousel section={getSection('salon_men')} cartItems={cart.items} onAddToCart={handleAddToCart} onUpdateQuantity={handleUpdateQuantity} onCardClick={handleSelectService} onSeeAll={() => {}} />

        <SeoDescription />
        <PopularTags
          popularTags={homepageData?.popular_tags || []}
          onSelectTag={(tag) => {
            const matched = allServices.find(s => s.title.toLowerCase().includes(tag.tag_name.toLowerCase()));
            if (matched) handleSelectService(matched);
            else if (tag.category_slug) handleSelectCategory(tag.category_slug);
          }}
        />
      </main>

      <Footer />

      <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} locations={locations} currentLocation={currentLocation} onSelectLocation={setCurrentLocation} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cart={cart} currentLocation={currentLocation} onUpdateQuantity={handleUpdateQuantity} onRemoveItem={handleRemoveFromCart} onBookingSuccess={(result) => { setBookingSuccess(result); setCart({ items: [], item_count: 0, total_amount: 0, discount: 0 }); }} />
      <ServiceDetailModal service={selectedService} isOpen={isServiceModalOpen} onClose={() => setIsServiceModalOpen(false)} quantityInCart={selectedService ? (cart.items.find(i => i.id === selectedService.id)?.quantity || 0) : 0} onAddToCart={handleAddToCart} onUpdateQuantity={handleUpdateQuantity} />
      <BookingSuccessModal isOpen={!!bookingSuccess} bookingResult={bookingSuccess} onClose={() => setBookingSuccess(null)} />

      {/* Voice Search Modal */}
      <VoiceSearchModal
        isOpen={isVoiceSearchOpen}
        onClose={() => setIsVoiceSearchOpen(false)}
        onVoiceResult={handleVoiceResult}
      />
    </div>
  );
}
