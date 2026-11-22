import sqlite3
import os

DB_PATH = os.environ.get("SQLITE_DB_PATH", os.path.join(os.path.dirname(__file__), "urbab366.db"))

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon_type TEXT NOT NULL,
    badge TEXT,
    group_type TEXT DEFAULT 'regular',
    display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    rating REAL NOT NULL,
    review_count TEXT NOT NULL,
    duration_mins INTEGER NOT NULL,
    price REAL NOT NULL,
    original_price REAL,
    is_luxe INTEGER DEFAULT 0,
    image_url TEXT NOT NULL,
    section_group TEXT NOT NULL,
    description TEXT,
    features TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    eyebrow TEXT,
    title TEXT NOT NULL,
    subtitle TEXT,
    badge TEXT,
    cta_text TEXT NOT NULL,
    cta_link TEXT,
    image_url TEXT NOT NULL,
    bg_gradient TEXT,
    display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS curations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT NOT NULL,
    video_duration TEXT DEFAULT '0:30',
    display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    area_name TEXT NOT NULL,
    locality TEXT NOT NULL,
    city TEXT DEFAULT 'Bengaluru',
    pincode TEXT NOT NULL,
    address_line TEXT NOT NULL,
    is_default INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS popular_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag_name TEXT NOT NULL,
    category_slug TEXT,
    search_query TEXT,
    display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    address TEXT NOT NULL,
    scheduled_date TEXT NOT NULL,
    scheduled_time TEXT NOT NULL,
    total_amount REAL NOT NULL,
    payment_method TEXT DEFAULT 'Cash on Delivery',
    items_json TEXT,
    status TEXT DEFAULT 'confirmed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

SEED_SQL = """
-- 1. Categories
INSERT INTO categories (id, name, slug, icon_type, badge, group_type, display_order) VALUES
(1, 'Women''s Salon & Spa', 'womens-salon-spa', 'Sparkles', NULL, 'regular', 1),
(2, 'Men''s Salon & Massage', 'mens-salon-massage', 'UserCheck', NULL, 'regular', 2),
(3, 'Cleaning & Pest Control', 'cleaning-pest-control', 'SprayCan', NULL, 'regular', 3),
(4, 'Wall makeover', 'wall-makeover', 'Palette', 'Trending', 'regular', 4),
(5, 'Home Painting & Decor', 'home-painting', 'Paintbrush', NULL, 'regular', 5),
(6, 'AC & Appliance Repair', 'ac-appliance-repair', 'Wrench', NULL, 'regular', 6),
(7, 'Electrician, Plumber & Carpenter', 'electrician-plumber-carpenter', 'Hammer', NULL, 'regular', 7),
(8, 'All 366 Services', 'all-services', 'Grid', NULL, 'regular', 8),
(9, 'Urbab Pure RO Purifier', 'native-water-purifier', 'Droplets', '2-Yr Filter Life', 'native', 9),
(10, 'Urbab Bio Smart Locks', 'native-smart-locks', 'Lock', 'Smart Living', 'native', 10);

-- 2. Banners
INSERT INTO banners (id, type, eyebrow, title, subtitle, badge, cta_text, cta_link, image_url, bg_gradient, display_order) VALUES
(1, 'hero', '366 Days of Reliable Comfort', 'Home services on demand, crafted for Bengaluru', 'Certified professionals at your doorstep within 60 minutes. Experience the new standard.', 'Flat ₹200 OFF', 'Explore Services', '/services?section=most_booked', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80', 'from-indigo-600 via-violet-600 to-purple-600', 1),
(2, 'spotlight', 'Urbab Pure Series', 'Next-Gen RO with 2-Year Filter Life', 'Zero maintenance filter guarantee. Real-time TDS water monitoring on mobile.', '₹1,500 OFF', 'Buy Now', '/native-purifier', 'https://images.unsplash.com/photo-1585670149967-b4f4da88cc9f?auto=format&fit=crop&w=600&q=80', 'from-slate-900 to-indigo-950', 1),
(3, 'spotlight', 'Power Bathroom Cleaning', 'Intense Stain & Scale Restoration', 'Mechanized buffing removes stubborn Bengaluru hard-water scaling.', '4.88 ★ Rated', 'Book Now', '/services?section=cleaning_essentials', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80', 'from-zinc-900 to-blue-950', 2),
(4, 'spotlight', 'Executive Massage for Men', 'Ease Work Stress & Traffic Fatigue', 'Deep tissue acupressure & lavender aromatic oils for full relaxation.', 'Popular', 'Book Now', '/services?section=massage_men', 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=600&q=80', 'from-amber-950 to-stone-900', 3),
(5, 'spotlight', 'Modular Kitchen Deep Clean', 'Full Chimney & Slab Degreasing', 'Heavy food oil removal and anti-bacterial hygiene treatment.', 'Bestseller', 'Book Now', '/services?section=cleaning_essentials', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80', 'from-emerald-950 to-teal-900', 4),
(6, 'feature', 'Deep Bathroom Glow', 'Restore Sparkling Cleanliness to Your Home', 'Removes 99.9% of yellow lime deposits, sanitizes faucets and ceramic tiles.', 'Urbab366 Verified', 'Book Session', '/services?section=cleaning_essentials', 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80', 'from-sky-50 to-violet-50', 1),
(7, 'branded', 'Urbab366 Signature M2', 'Limited Edition Smart RO Purifier', 'Celebrated in 5,00,000+ Indian Homes. Dual UV-C sterilization and digital TDS tracker.', '2-Yr Warranty', 'Order Now', '/native-m2-pro', 'https://images.unsplash.com/photo-1584473457406-6240486418e9?auto=format&fit=crop&w=1200&q=80', 'from-amber-950 via-stone-900 to-neutral-900', 2),
(8, 'feature', 'Designer Acoustic Wall Panels', 'Upgrade Your Room Aesthetics in Hours', 'Modern fluted wood and sound-dampening geometric wall panels.', 'Starts ₹8,999', 'Book Consultation', '/wall-panels', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80', 'from-orange-50 to-amber-50', 3);

-- 3. Curations
INSERT INTO curations (id, title, subtitle, category, image_url, video_duration, display_order) VALUES
(1, 'Architectural Wall Panels', 'Custom 3D fluted accent walls', 'Interior Design', 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=600&q=80', '0:45', 1),
(2, 'Gentlemen''s Grooming', 'Precision fade & beard shaping', 'Male Grooming', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80', '0:35', 2),
(3, 'Holistic Candle Spa', 'Organic essential oil therapy', 'Wellness Rituals', 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=600&q=80', '0:40', 3),
(4, 'Zero-Mess Home Painting', 'Laser-guided waterproof finish', 'Home Transformation', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80', '0:30', 4);

-- 4. Services
INSERT INTO services (id, category_id, title, slug, rating, review_count, duration_mins, price, original_price, is_luxe, image_url, section_group, description, features) VALUES
(1, 1, 'Threading & Eyebrow Styling', 'threading', 4.85, '31.2K', 15, 49.00, NULL, 0, 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=600&q=80', 'most_booked', 'High-precision facial threading with sanitized thread and soothing ice aloe mist.', 'Organic antibacterial thread,Soothed with cold aloe,Quick 15 min session'),
(2, 3, 'Intense 2-Bathroom Deep Clean', 'intense-cleaning-2-bathroom', 4.88, '1.45M', 100, 998.00, 1199.00, 0, 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80', 'most_booked', 'Mechanized floor buffing, grout descaling, WC sanitation & mirror chrome buffing.', 'Buffing machine scrubbing,Hard water scale removal,Child & pet safe solutions'),
(3, 3, 'Fabric Sofa Shampoo & Extraction', 'fabric-sofa-cleaning', 4.89, '305.4K', 45, 299.00, 399.00, 0, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80', 'most_booked', 'Deep dust extraction, foam enzyme shampoo, and moisture extraction.', 'Industrial injection vacuum,Deep stain removal,Fast 2-hour dry time'),
(4, 7, 'Plumbing & Tap Repair', 'tap-repair', 4.82, '385.1K', 30, 129.00, 149.00, 0, 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80', 'most_booked', 'Leak troubleshooting, spindle cartridge swap, and washer servicing by certified plumber.', 'Leak detection & fixing,Spindle or washer change,90-day Urbab366 warranty'),
(5, 7, 'Precision Wall Drill (Per Hole)', 'drill-per-hole', 4.94, '330.2K', 10, 76.00, 99.00, 0, 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80', 'most_booked', 'Level-guided drilling for mirrors, TV mounts, paintings & heavy wall brackets.', 'Includes plugs & screws,Vacuum dust catcher,Laser alignment'),
(6, 1, 'Luxe Threading & Ice Roller', 'luxe-threading', 4.91, '54.2K', 15, 99.00, 149.00, 1, 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80', 'most_booked', 'Premium hypoallergenic cotton thread, soothing pre-wax lotion, and cryo ice roller.', 'Luxe 5-star beautician,Ice roller calming massage,Single-use disposable kit'),
(7, 3, 'Furnished Full Apartment Deep Clean', 'furnished-apartment-deep-cleaning', 4.87, '580.6K', 240, 1499.00, 1899.00, 0, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80', 'cleaning_essentials', 'Floor-to-ceiling sanitization: balconies, kitchen grease, bedrooms & washrooms.', 'All rooms & balconies,Kitchen grease degreasing,Sanitization of touch points'),
(8, 3, 'Ceiling Fan Anti-Static Polish', 'ceiling-fan-cleaning', 4.80, '135.0K', 20, 99.00, 149.00, 0, 'https://images.unsplash.com/photo-1617103996702-96ff29b1c467?auto=format&fit=crop&w=600&q=80', 'cleaning_essentials', 'Blade degreasing, motor housing dust extraction, and anti-static shine spray.', 'Anti-static shine spray,Floor protective sheet,Quiet motor balance check'),
(9, 3, 'Move-in Vacant Apartment Cleaning', 'unfurnished-apartment-deep-cleaning', 4.84, '210.3K', 180, 1199.00, 1499.00, 0, 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80', 'cleaning_essentials', 'Recommended before moving into a new home: paint stain removal & floor polishing.', 'Rotary buffer floor scrub,Switchboard & track cleaning,Full kitchen sanitization'),
(10, 3, 'Odorless Cockroach & Pest Control', 'kitchen-bathroom-pest-control', 4.86, '340.5K', 45, 799.00, 999.00, 0, 'https://images.unsplash.com/photo-1587582423116-ec07293f0395?auto=format&fit=crop&w=600&q=80', 'cleaning_essentials', 'Bayer non-toxic gel baiting in all cabinets, drains, and crevices.', '100% Odorless & child-safe,Covers all kitchen crevices,90-day pest-free warranty'),
(11, 1, 'Peel-Off Face Waxing', 'peel-off-face-waxing', 4.84, '155.1K', 20, 89.00, 119.00, 0, 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80', 'salon_women', 'Stripless peel-off wax for sensitive lip, chin, and eyebrow borders.', 'Low pain formulation,Calms skin redness,Includes soothing aloe gel'),
(12, 1, 'French Cirepil Face Wax (Luxe)', 'cirepil-face-wax-luxe', 4.93, '92.4K', 25, 199.00, 249.00, 1, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80', 'salon_women', 'Hypoallergenic French Cirepil low-temperature wax for sensitive facial skin.', 'Hypoallergenic French wax,Zero skin peeling,Gentle botanical formulation'),
(13, 1, 'Rica Chocolate Brazilian Wax', 'rica-bikini-wax', 4.88, '108.5K', 30, 799.00, 999.00, 1, 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=600&q=80', 'salon_women', '100% Colophony-free Italian Rica wax enriched with soothing cocoa butter.', 'Imported Italian wax,Disposable bedspreads,Certified woman specialist'),
(14, 1, 'O3+ Power Radiance Facial', 'o3-power-glow-facial', 4.87, '169.2K', 60, 1199.00, 1499.00, 0, 'https://images.unsplash.com/photo-1512290900672-1f4806a6b579?auto=format&fit=crop&w=600&q=80', 'salon_women', '7-step instant skin revitalizer: ultrasonic peel, blackhead extraction & algae mask.', 'Single-use sealed O3+ pack,Ultrasonic pore cleaning,Cooling peel-off mask'),
(15, 1, 'Swedish Stress Buster Massage', 'stress-relief-swedish-massage', 4.89, '198.4K', 60, 1319.00, 1599.00, 0, 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80', 'spa_women', 'Gentle long gliding strokes using warm almond oils to relax muscles and restore calmness.', 'Warm aromatic oils,Single-use spa sheet,Diffuser aromatherapy'),
(16, 1, 'Deep Tissue Muscle Relief Massage', 'deep-tissue-pain-relief-massage', 4.88, '152.0K', 60, 1469.00, 1749.00, 0, 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=600&q=80', 'spa_women', 'Targeted firm thumb and palm pressure on knotty shoulders, neck and lower back.', 'Firm pressure technique,Ayurvedic herbal balms,Full disposable linen kit'),
(17, 1, 'Sublime Swedish Massage (Luxe)', 'sublime-swedish-luxe', 4.95, '72.3K', 75, 1719.00, 2099.00, 1, 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=600&q=80', 'spa_women', 'Premium cold-pressed lavender oils with hot herbal towel compression.', 'Senior 5-star therapist,Hot towel compression,Cold pressed organic oil'),
(18, 1, 'Hot Volcanic Stone Healing (Luxe)', 'deep-tissue-healing-luxe', 4.93, '59.1K', 90, 1969.00, 2399.00, 1, 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=600&q=80', 'spa_women', 'Volcanic basalt stone thermal therapy to melt stubborn muscular tension.', 'Heated volcanic stones,Herbal poultice compress,Calming ambient music'),
(19, 6, 'Washing Machine Diagnostic & Tune-up', 'washing-machine-check-up', 4.84, '189.4K', 45, 199.00, 249.00, 0, 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=600&q=80', 'appliance_repair', 'Comprehensive diagnosis of motor vibration, drainage pump, drum spin & PCB errors.', 'Front load & top load experts,Transparent repair quote,30-day warranty'),
(20, 6, 'RO Water Purifier Service & Filter Test', 'water-purifier-service', 4.87, '220.1K', 45, 249.00, 299.00, 0, 'https://images.unsplash.com/photo-1585670149967-b4f4da88cc9f?auto=format&fit=crop&w=600&q=80', 'appliance_repair', 'Digital TDS measurement, membrane health check, booster pump & UV lamp test.', 'TDS & mineral testing,All major purifier brands,Certified technician'),
(21, 6, 'Water Geyser Safety & Heating Check', 'geyser-check-up', 4.82, '102.3K', 45, 249.00, 299.00, 0, 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80', 'appliance_repair', 'Heating coil efficiency test, thermostat inspection, and pressure valve tune-up.', 'Coil heating diagnostic,Thermostat safety check,High-pressure plumbing safety'),
(22, 6, 'AC Powerjet 2x Coil Wash', 'ac-powerjet-service', 4.90, '489.2K', 60, 499.00, 699.00, 0, 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80', 'appliance_repair', 'High-pressure powerjet wash with waterproof apron to eliminate mold & improve cooling.', 'Powerjet coil wash,Indoor mold elimination,Gas pressure & cooling check'),
(23, 7, 'Smart Switch & Socket Install', 'switch-replace-install', 4.91, '225.4K', 20, 76.00, 99.00, 0, 'https://images.unsplash.com/photo-1558441719-75573e34a6ef?auto=format&fit=crop&w=600&q=80', 'home_repairs', 'Modular switch, power socket, fan regulator, and MCB replacement with safety check.', 'Tested with multimeter,Shock-resistant fitting,Tight wire termination'),
(24, 7, 'Certified Plumber Consultation', 'plumber-consultation', 4.81, '195.0K', 30, 149.00, 199.00, 0, 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80', 'home_repairs', 'Detailed inspection for pipe blockages, wall seepage, water motor or fittings.', 'Adjusted against final bill,Leak detector inspection,Genuine parts assurance'),
(25, 7, 'Certified Electrician Consultation', 'electrician-consultation', 4.84, '208.6K', 30, 149.00, 199.00, 0, 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80', 'home_repairs', 'Complete circuit diagnostic, MCB tripping, short circuit tracing and earth check.', 'Adjusted against final bill,Licensed electrician,Complete insulated toolset'),
(26, 7, 'Furniture & Double Bed Assembly', 'double-bed-assembly', 4.89, '82.1K', 90, 699.00, 899.00, 0, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80', 'home_repairs', 'Sturdy assembly for hydraulic storage beds, flatbeds, and wardrobe units.', 'All brands (IKEA, Wakefit, Pepperfry),Sturdy bolt alignment,Scratch protection mats'),
(27, 2, 'Men''s Deep Tissue Back Relief', 'mens-deep-tissue-massage', 4.86, '108.3K', 60, 1429.00, 1699.00, 0, 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=600&q=80', 'massage_men', 'Focused trigger point release for stiff lower back, shoulder knots, and neck ache.', 'Deep thumb & palm friction,Anti-inflammatory herbal balm,Single-use hygiene kit'),
(28, 2, 'Men''s Swedish Relaxation Massage', 'mens-swedish-massage', 4.84, '86.5K', 60, 1299.00, 1549.00, 0, 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=600&q=80', 'massage_men', 'Calming long strokes with warm olive & jojoba oil to ease workday stress.', 'Relaxing music & aroma,Improves sleep quality,Tension releasing strokes'),
(29, 2, 'Hot Basalt Stone Therapy (Luxe)', 'mens-deep-tissue-luxe', 4.92, '41.2K', 75, 1869.00, 2199.00, 1, 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80', 'massage_men', 'Therapeutic hot volcanic basalt stones and herbal poultice compress.', 'Hot volcanic stones,Cold pressed organic oils,Head & foot reflexology'),
(30, 2, 'Ayurvedic Abhyangam Full Body', 'abhyangam-massage-men', 4.88, '49.8K', 60, 1529.00, 1799.00, 0, 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80', 'massage_men', 'Traditional rhythmic stroke therapy with warm medicated Dhanwantharam oil.', 'Authentic herbal Ayurvedic oils,Cleanses body channels,Restores natural vigor'),
(31, 2, 'Precision Men''s Haircut', 'haircut-men', 4.88, '225.4K', 30, 259.00, 299.00, 0, 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80', 'salon_men', 'Modern fade, buzz or classic scissor cut with neck shave and dry shampoo sponge.', 'Sterilized clippers & scissors,Disposable neck strip & cape,Hair styling wax finish'),
(32, 2, 'Luxe Executive Hair Styling', 'haircut-men-luxe', 4.94, '74.6K', 40, 459.00, 549.00, 1, 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80', 'salon_men', 'Master barber haircut, 10-minute cooling scalp acupressure massage and hot towel.', 'Senior master stylist,10-minute scalp massage,Premium hair tonic finish'),
(33, 2, 'Beard Sculpting & Razor Edge', 'beard-trimming-styling', 4.86, '138.4K', 20, 166.00, 199.00, 0, 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80', 'salon_men', 'Crisp cheekline definition, mustache trimming and nourishing cedarwood oil.', 'Straight razor crisp lines,Beard softening oil,Anti-irritation post-shave balm'),
(34, 2, 'Executive Complete Grooming (Luxe)', 'grooming-essentials-luxe', 4.91, '48.2K', 60, 768.00, 949.00, 1, 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80', 'salon_men', 'Full package: Luxe Haircut + Beard Sculpting + Charcoal blackhead peel and neck massage.', 'Complete executive package,Activated charcoal clean-up,Saves ₹280 vs standalone');

-- 5. Bangalore Locations
INSERT INTO locations (id, area_name, locality, city, pincode, address_line, is_default) VALUES
(1, 'Richmond Town', 'Central Bengaluru', 'Bengaluru', '560025', '3, Norris Rd, Richmond Town, Bengaluru, Karnataka 560025', 1),
(2, 'Indiranagar', 'East Bengaluru', 'Bengaluru', '560038', '100ft Road, 12th Main, Indiranagar, Bengaluru, Karnataka 560038', 0),
(3, 'Koramangala', 'South Bengaluru', 'Bengaluru', '560034', '5th Block, 80ft Road, Koramangala, Bengaluru, Karnataka 560034', 0),
(4, 'HSR Layout', 'South-East Bengaluru', 'Bengaluru', '560102', 'Sector 1, 27th Main, HSR Layout, Bengaluru, Karnataka 560102', 0),
(5, 'Whitefield', 'East Bengaluru', 'Bengaluru', '560066', 'ITPL Main Rd, Whitefield, Bengaluru, Karnataka 560066', 0),
(6, 'Jayanagar', 'South Bengaluru', 'Bengaluru', '560041', '4th Block, 11th Main, Jayanagar, Bengaluru, Karnataka 560041', 0),
(7, 'Malleshwaram', 'North-West Bengaluru', 'Bengaluru', '560003', 'Sampige Road, Malleshwaram, Bengaluru, Karnataka 560003', 0),
(8, 'Bellandur', 'South-East Bengaluru', 'Bengaluru', '560103', 'Green Glen Layout, Bellandur, Bengaluru, Karnataka 560103', 0),
(9, 'Electronic City', 'South Bengaluru', 'Bengaluru', '560100', 'Phase 1, Electronic City, Bengaluru, Karnataka 560100', 0);

-- 6. Popular Services in Bangalore
INSERT INTO popular_tags (id, tag_name, category_slug, search_query, display_order) VALUES
(1, 'Urbab Pure RO Purifier', 'native-water-purifier', 'water purifier', 1),
(2, 'Urbab Bio Smart Locks', 'native-smart-locks', 'smart locks', 2),
(3, 'Full Home / Room Cleaning', 'cleaning-pest-control', 'full home cleaning', 3),
(4, 'Gas Stove Flame Service', 'ac-appliance-repair', 'gas stove', 4),
(5, 'Laptop Hardware Repair', 'ac-appliance-repair', 'laptop', 5),
(6, 'Women''s Hair Studio', 'womens-salon-spa', 'haircut women', 6),
(7, 'AC Powerjet Service', 'ac-appliance-repair', 'ac service', 7),
(8, 'Threading & Eyebrow', 'womens-salon-spa', 'threading', 8),
(9, 'Intense Bathroom Scrubbing', 'cleaning-pest-control', 'bathroom cleaning', 9),
(10, 'Plumbing & Tap Repair', 'electrician-plumber-carpenter', 'tap repair', 10),
(11, 'Wall Drilling (Per Hole)', 'electrician-plumber-carpenter', 'drill', 11),
(12, 'Modular Switch Installation', 'electrician-plumber-carpenter', 'switch', 12),
(13, 'Ceiling Fan Cleaning', 'cleaning-pest-control', 'fan cleaning', 13),
(14, 'Odorless Cockroach Control', 'cleaning-pest-control', 'pest control', 14),
(15, 'French Cirepil Face Wax', 'womens-salon-spa', 'face wax', 15),
(16, 'Swedish Stress Relief Massage', 'womens-salon-spa', 'swedish massage', 16),
(17, 'Sublime Swedish Massage (Luxe)', 'womens-salon-spa', 'massage luxe', 17),
(18, 'Washing Machine Repair', 'ac-appliance-repair', 'washing machine', 18),
(19, 'RO Purifier Service', 'ac-appliance-repair', 'purifier service', 19),
(20, 'Water Geyser Safety Check', 'ac-appliance-repair', 'geyser', 20),
(21, 'Designer Wall Panels', 'wall-makeover', 'wall panels', 21),
(22, 'Double Bed Assembly', 'electrician-plumber-carpenter', 'bed assembly', 22),
(23, 'Men''s Deep Tissue Massage', 'mens-salon-massage', 'deep tissue', 23),
(24, 'Hot Basalt Stone Therapy', 'mens-salon-massage', 'healing therapy', 24),
(25, 'Ayurvedic Abhyangam Massage', 'mens-salon-massage', 'abhyangam', 25),
(26, 'Precision Men''s Haircut', 'mens-salon-massage', 'haircut men', 26),
(27, 'Executive Complete Grooming', 'mens-salon-massage', 'grooming', 27);
"""

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def query_all(query: str, params: tuple = ()):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def query_one(query: str, params: tuple = ()):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

def execute_write(query: str, params: tuple = ()):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()

def init_db():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.executescript(SCHEMA_SQL)
        conn.commit()

        # Check if tables need seeding
        cursor.execute("SELECT count(*) as count FROM categories")
        row = cursor.fetchone()
        if row and row[0] == 0:
            print("Seeding database with initial Urbab366 data...")
            cursor.executescript(SEED_SQL)
            conn.commit()
            print("Database seeded successfully.")

        cursor.execute("SELECT count(*) as count FROM categories")
        cat_count = cursor.fetchone()[0]
        cursor.execute("SELECT count(*) as count FROM services")
        srv_count = cursor.fetchone()[0]
        print(f"Urbab366 SQLite ready at '{DB_PATH}' ({cat_count} categories, {srv_count} services).")
    finally:
        conn.close()

if __name__ == "__main__":
    init_db()
    cats = query_all("SELECT count(*) as count FROM categories")
    print("Categories Count:", cats)
