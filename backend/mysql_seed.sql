-- Urbab366 Bangalore MySQL Seed Data
USE urbab366_db;

-- 1. Categories
INSERT INTO categories (name, slug, icon_type, badge, group_type, display_order) VALUES
('Women''s Salon & Spa', 'womens-salon-spa', 'Sparkles', NULL, 'regular', 1),
('Men''s Salon & Massage', 'mens-salon-massage', 'UserCheck', NULL, 'regular', 2),
('Cleaning & Pest Control', 'cleaning-pest-control', 'SprayCan', NULL, 'regular', 3),
('Wall makeover', 'wall-makeover', 'Palette', 'Trending', 'regular', 4),
('Home Painting & Decor', 'home-painting', 'Paintbrush', NULL, 'regular', 5),
('AC & Appliance Repair', 'ac-appliance-repair', 'Wrench', NULL, 'regular', 6),
('Electrician, Plumber & Carpenter', 'electrician-plumber-carpenter', 'Hammer', NULL, 'regular', 7),
('All 366 Services', 'all-services', 'Grid', NULL, 'regular', 8),
('Urbab Pure RO Purifier', 'native-water-purifier', 'Droplets', '2-Yr Filter Life', 'native', 9),
('Urbab Bio Smart Locks', 'native-smart-locks', 'Lock', 'Smart Living', 'native', 10);

-- 2. Banners
INSERT INTO banners (type, eyebrow, title, subtitle, badge, cta_text, cta_link, image_url, bg_gradient, display_order) VALUES
('hero', '366 Days of Reliable Comfort', 'Home services on demand, crafted for Bengaluru', 'Certified professionals at your doorstep within 60 minutes. Experience the new standard.', 'Flat ₹200 OFF', 'Explore Services', '/services?section=most_booked', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80', 'from-indigo-600 via-violet-600 to-purple-600', 1),
('spotlight', 'Urbab Pure Series', 'Next-Gen RO with 2-Year Filter Life', 'Zero maintenance filter guarantee. Real-time TDS water monitoring on mobile.', '₹1,500 OFF', 'Buy Now', '/native-purifier', 'https://images.unsplash.com/photo-1585670149967-b4f4da88cc9f?auto=format&fit=crop&w=600&q=80', 'from-slate-900 to-indigo-950', 1),
('spotlight', 'Power Bathroom Cleaning', 'Intense Stain & Scale Restoration', 'Mechanized buffing removes stubborn Bengaluru hard-water scaling.', '4.88 ★ Rated', 'Book Now', '/services?section=cleaning_essentials', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80', 'from-zinc-900 to-blue-950', 2),
('spotlight', 'Executive Massage for Men', 'Ease Work Stress & Traffic Fatigue', 'Deep tissue acupressure & lavender aromatic oils for full relaxation.', 'Popular', 'Book Now', '/services?section=massage_men', 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=600&q=80', 'from-amber-950 to-stone-900', 3),
('spotlight', 'Modular Kitchen Deep Clean', 'Full Chimney & Slab Degreasing', 'Heavy food oil removal and anti-bacterial hygiene treatment.', 'Bestseller', 'Book Now', '/services?section=cleaning_essentials', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80', 'from-emerald-950 to-teal-900', 4),
('feature', 'Deep Bathroom Glow', 'Restore Sparkling Cleanliness to Your Home', 'Removes 99.9% of yellow lime deposits, sanitizes faucets and ceramic tiles.', 'Urbab366 Verified', 'Book Session', '/services?section=cleaning_essentials', 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80', 'from-sky-50 to-violet-50', 1),
('branded', 'Urbab366 Signature M2', 'Limited Edition Smart RO Purifier', 'Celebrated in 5,00,000+ Indian Homes. Dual UV-C sterilization and digital TDS tracker.', '2-Yr Warranty', 'Order Now', '/native-m2-pro', 'https://images.unsplash.com/photo-1584473457406-6240486418e9?auto=format&fit=crop&w=1200&q=80', 'from-amber-950 via-stone-900 to-neutral-900', 2),
('feature', 'Designer Acoustic Wall Panels', 'Upgrade Your Room Aesthetics in Hours', 'Modern fluted wood and sound-dampening geometric wall panels.', 'Starts ₹8,999', 'Book Consultation', '/wall-panels', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80', 'from-orange-50 to-amber-50', 3);

-- 3. Curations
INSERT INTO curations (title, subtitle, category, image_url, video_duration, display_order) VALUES
('Architectural Wall Panels', 'Custom 3D fluted accent walls', 'Interior Design', 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=600&q=80', '0:45', 1),
('Gentlemen''s Grooming', 'Precision fade & beard shaping', 'Male Grooming', 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80', '0:35', 2),
('Holistic Candle Spa', 'Organic essential oil therapy', 'Wellness Rituals', 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=600&q=80', '0:40', 3),
('Zero-Mess Home Painting', 'Laser-guided waterproof finish', 'Home Transformation', 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80', '0:30', 4);

-- 4. Services
INSERT INTO services (category_id, title, slug, rating, review_count, duration_mins, price, original_price, is_luxe, image_url, section_group, description, features) VALUES
(1, 'Threading & Eyebrow Styling', 'threading', 4.85, '31.2K', 15, 49.00, NULL, 0, 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=600&q=80', 'most_booked', 'High-precision facial threading with sanitized thread and soothing ice aloe mist.', 'Organic antibacterial thread,Soothed with cold aloe,Quick 15 min session'),
(3, 'Intense 2-Bathroom Deep Clean', 'intense-cleaning-2-bathroom', 4.88, '1.45M', 100, 998.00, 1199.00, 0, 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80', 'most_booked', 'Mechanized floor buffing, grout descaling, WC sanitation & mirror chrome buffing.', 'Buffing machine scrubbing,Hard water scale removal,Child & pet safe solutions'),
(3, 'Fabric Sofa Shampoo & Extraction', 'fabric-sofa-cleaning', 4.89, '305.4K', 45, 299.00, 399.00, 0, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80', 'most_booked', 'Deep dust extraction, foam enzyme shampoo, and moisture extraction.', 'Industrial injection vacuum,Deep stain removal,Fast 2-hour dry time'),
(7, 'Plumbing & Tap Repair', 'tap-repair', 4.82, '385.1K', 30, 129.00, 149.00, 0, 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80', 'most_booked', 'Leak troubleshooting, spindle cartridge swap, and washer servicing by certified plumber.', 'Leak detection & fixing,Spindle or washer change,90-day Urbab366 warranty'),
(7, 'Precision Wall Drill (Per Hole)', 'drill-per-hole', 4.94, '330.2K', 10, 76.00, 99.00, 0, 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80', 'most_booked', 'Level-guided drilling for mirrors, TV mounts, paintings & heavy wall brackets.', 'Includes plugs & screws,Vacuum dust catcher,Laser alignment'),
(1, 'Luxe Threading & Ice Roller', 'luxe-threading', 4.91, '54.2K', 15, 99.00, 149.00, 1, 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80', 'most_booked', 'Premium hypoallergenic cotton thread, soothing pre-wax lotion, and cryo ice roller.', 'Luxe 5-star beautician,Ice roller calming massage,Single-use disposable kit'),
(3, 'Furnished Full Apartment Deep Clean', 'furnished-apartment-deep-cleaning', 4.87, '580.6K', 240, 1499.00, 1899.00, 0, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80', 'cleaning_essentials', 'Floor-to-ceiling sanitization: balconies, kitchen grease, bedrooms & washrooms.', 'All rooms & balconies,Kitchen grease degreasing,Sanitization of touch points'),
(3, 'Ceiling Fan Anti-Static Polish', 'ceiling-fan-cleaning', 4.80, '135.0K', 20, 99.00, 149.00, 0, 'https://images.unsplash.com/photo-1617103996702-96ff29b1c467?auto=format&fit=crop&w=600&q=80', 'cleaning_essentials', 'Blade degreasing, motor housing dust extraction, and anti-static shine spray.', 'Anti-static shine spray,Floor protective sheet,Quiet motor balance check'),
(3, 'Move-in Vacant Apartment Cleaning', 'unfurnished-apartment-deep-cleaning', 4.84, '210.3K', 180, 1199.00, 1499.00, 0, 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80', 'cleaning_essentials', 'Recommended before moving into a new home: paint stain removal & floor polishing.', 'Rotary buffer floor scrub,Switchboard & track cleaning,Full kitchen sanitization'),
(3, 'Odorless Cockroach & Pest Control', 'kitchen-bathroom-pest-control', 4.86, '340.5K', 45, 799.00, 999.00, 0, 'https://images.unsplash.com/photo-1587582423116-ec07293f0395?auto=format&fit=crop&w=600&q=80', 'cleaning_essentials', 'Bayer non-toxic gel baiting in all cabinets, drains, and crevices.', '100% Odorless & child-safe,Covers all kitchen crevices,90-day pest-free warranty'),
(1, 'Peel-Off Face Waxing', 'peel-off-face-waxing', 4.84, '155.1K', 20, 89.00, 119.00, 0, 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80', 'salon_women', 'Stripless peel-off wax for sensitive lip, chin, and eyebrow borders.', 'Low pain formulation,Calms skin redness,Includes soothing aloe gel'),
(1, 'French Cirepil Face Wax (Luxe)', 'cirepil-face-wax-luxe', 4.93, '92.4K', 25, 199.00, 249.00, 1, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80', 'salon_women', 'Hypoallergenic French Cirepil low-temperature wax for sensitive facial skin.', 'Hypoallergenic French wax,Zero skin peeling,Gentle botanical formulation'),
(1, 'Rica Chocolate Brazilian Wax', 'rica-bikini-wax', 4.88, '108.5K', 30, 799.00, 999.00, 1, 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=600&q=80', 'salon_women', '100% Colophony-free Italian Rica wax enriched with soothing cocoa butter.', 'Imported Italian wax,Disposable bedspreads,Certified woman specialist'),
(1, 'O3+ Power Radiance Facial', 'o3-power-glow-facial', 4.87, '169.2K', 60, 1199.00, 1499.00, 0, 'https://images.unsplash.com/photo-1512290900672-1f4806a6b579?auto=format&fit=crop&w=600&q=80', 'salon_women', '7-step instant skin revitalizer: ultrasonic peel, blackhead extraction & algae mask.', 'Single-use sealed O3+ pack,Ultrasonic pore cleaning,Cooling peel-off mask'),
(1, 'Swedish Stress Buster Massage', 'stress-relief-swedish-massage', 4.89, '198.4K', 60, 1319.00, 1599.00, 0, 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80', 'spa_women', 'Gentle long gliding strokes using warm almond oils to relax muscles and restore calmness.', 'Warm aromatic oils,Single-use spa sheet,Diffuser aromatherapy'),
(1, 'Deep Tissue Muscle Relief Massage', 'deep-tissue-pain-relief-massage', 4.88, '152.0K', 60, 1469.00, 1749.00, 0, 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=600&q=80', 'spa_women', 'Targeted firm thumb and palm pressure on knotty shoulders, neck and lower back.', 'Firm pressure technique,Ayurvedic herbal balms,Full disposable linen kit'),
(1, 'Sublime Swedish Massage (Luxe)', 'sublime-swedish-luxe', 4.95, '72.3K', 75, 1719.00, 2099.00, 1, 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=600&q=80', 'spa_women', 'Premium cold-pressed lavender oils with hot herbal towel compression.', 'Senior 5-star therapist,Hot towel compression,Cold pressed organic oil'),
(1, 'Hot Volcanic Stone Healing (Luxe)', 'deep-tissue-healing-luxe', 4.93, '59.1K', 90, 1969.00, 2399.00, 1, 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=600&q=80', 'spa_women', 'Volcanic basalt stone thermal therapy to melt stubborn muscular tension.', 'Heated volcanic stones,Herbal poultice compress,Calming ambient music'),
(6, 'Washing Machine Diagnostic & Tune-up', 'washing-machine-check-up', 4.84, '189.4K', 45, 199.00, 249.00, 0, 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=600&q=80', 'appliance_repair', 'Comprehensive diagnosis of motor vibration, drainage pump, drum spin & PCB errors.', 'Front load & top load experts,Transparent repair quote,30-day warranty'),
(6, 'RO Water Purifier Service & Filter Test', 'water-purifier-service', 4.87, '220.1K', 45, 249.00, 299.00, 0, 'https://images.unsplash.com/photo-1585670149967-b4f4da88cc9f?auto=format&fit=crop&w=600&q=80', 'appliance_repair', 'Digital TDS measurement, membrane health check, booster pump & UV lamp test.', 'TDS & mineral testing,All major purifier brands,Certified technician'),
(6, 'Water Geyser Safety & Heating Check', 'geyser-check-up', 4.82, '102.3K', 45, 249.00, 299.00, 0, 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80', 'appliance_repair', 'Heating coil efficiency test, thermostat inspection, and pressure valve tune-up.', 'Coil heating diagnostic,Thermostat safety check,High-pressure plumbing safety'),
(6, 'AC Powerjet 2x Coil Wash', 'ac-powerjet-service', 4.90, '489.2K', 60, 499.00, 699.00, 0, 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80', 'appliance_repair', 'High-pressure powerjet wash with waterproof apron to eliminate mold & improve cooling.', 'Powerjet coil wash,Indoor mold elimination,Gas pressure & cooling check'),
(7, 'Smart Switch & Socket Install', 'switch-replace-install', 4.91, '225.4K', 20, 76.00, 99.00, 0, 'https://images.unsplash.com/photo-1558441719-75573e34a6ef?auto=format&fit=crop&w=600&q=80', 'home_repairs', 'Modular switch, power socket, fan regulator, and MCB replacement with safety check.', 'Tested with multimeter,Shock-resistant fitting,Tight wire termination'),
(7, 'Certified Plumber Consultation', 'plumber-consultation', 4.81, '195.0K', 30, 149.00, 199.00, 0, 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80', 'home_repairs', 'Detailed inspection for pipe blockages, wall seepage, water motor or fittings.', 'Adjusted against final bill,Leak detector inspection,Genuine parts assurance'),
(7, 'Certified Electrician Consultation', 'electrician-consultation', 4.84, '208.6K', 30, 149.00, 199.00, 0, 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80', 'home_repairs', 'Complete circuit diagnostic, MCB tripping, short circuit tracing and earth check.', 'Adjusted against final bill,Licensed electrician,Complete insulated toolset'),
(7, 'Furniture & Double Bed Assembly', 'double-bed-assembly', 4.89, '82.1K', 90, 699.00, 899.00, 0, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80', 'home_repairs', 'Sturdy assembly for hydraulic storage beds, flatbeds, and wardrobe units.', 'All brands (IKEA, Wakefit, Pepperfry),Sturdy bolt alignment,Scratch protection mats'),
(2, 'Men''s Deep Tissue Back Relief', 'mens-deep-tissue-massage', 4.86, '108.3K', 60, 1429.00, 1699.00, 0, 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=600&q=80', 'massage_men', 'Focused trigger point release for stiff lower back, shoulder knots, and neck ache.', 'Deep thumb & palm friction,Anti-inflammatory herbal balm,Single-use hygiene kit'),
(2, 'Men''s Swedish Relaxation Massage', 'mens-swedish-massage', 4.84, '86.5K', 60, 1299.00, 1549.00, 0, 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=600&q=80', 'massage_men', 'Calming long strokes with warm olive & jojoba oil to ease workday stress.', 'Relaxing music & aroma,Improves sleep quality,Tension releasing strokes'),
(2, 'Hot Basalt Stone Therapy (Luxe)', 'mens-deep-tissue-luxe', 4.92, '41.2K', 75, 1869.00, 2199.00, 1, 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80', 'massage_men', 'Therapeutic hot volcanic basalt stones and herbal poultice compress.', 'Hot volcanic stones,Cold pressed organic oils,Head & foot reflexology'),
(2, 'Ayurvedic Abhyangam Full Body', 'abhyangam-massage-men', 4.88, '49.8K', 60, 1529.00, 1799.00, 0, 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80', 'massage_men', 'Traditional rhythmic stroke therapy with warm medicated Dhanwantharam oil.', 'Authentic herbal Ayurvedic oils,Cleanses body channels,Restores natural vigor'),
(2, 'Precision Men''s Haircut', 'haircut-men', 4.88, '225.4K', 30, 259.00, 299.00, 0, 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80', 'salon_men', 'Modern fade, buzz or classic scissor cut with neck shave and dry shampoo sponge.', 'Sterilized clippers & scissors,Disposable neck strip & cape,Hair styling wax finish'),
(2, 'Luxe Executive Hair Styling', 'haircut-men-luxe', 4.94, '74.6K', 40, 459.00, 549.00, 1, 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80', 'salon_men', 'Master barber haircut, 10-minute cooling scalp acupressure massage and hot towel.', 'Senior master stylist,10-minute scalp massage,Premium hair tonic finish'),
(2, 'Beard Sculpting & Razor Edge', 'beard-trimming-styling', 4.86, '138.4K', 20, 166.00, 199.00, 0, 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80', 'salon_men', 'Crisp cheekline definition, mustache trimming and nourishing cedarwood oil.', 'Straight razor crisp lines,Beard softening oil,Anti-irritation post-shave balm'),
(2, 'Executive Complete Grooming (Luxe)', 'grooming-essentials-luxe', 4.91, '48.2K', 60, 768.00, 949.00, 1, 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80', 'salon_men', 'Full package: Luxe Haircut + Beard Sculpting + Charcoal blackhead peel and neck massage.', 'Complete executive package,Activated charcoal clean-up,Saves ₹280 vs standalone');

-- 5. Bangalore Locations
INSERT INTO locations (area_name, locality, city, pincode, address_line, is_default) VALUES
('Richmond Town', 'Central Bengaluru', 'Bengaluru', '560025', '3, Norris Rd, Richmond Town, Bengaluru, Karnataka 560025', 1),
('Indiranagar', 'East Bengaluru', 'Bengaluru', '560038', '100ft Road, 12th Main, Indiranagar, Bengaluru, Karnataka 560038', 0),
('Koramangala', 'South Bengaluru', 'Bengaluru', '560034', '5th Block, 80ft Road, Koramangala, Bengaluru, Karnataka 560034', 0),
('HSR Layout', 'South-East Bengaluru', 'Bengaluru', '560102', 'Sector 1, 27th Main, HSR Layout, Bengaluru, Karnataka 560102', 0),
('Whitefield', 'East Bengaluru', 'Bengaluru', '560066', 'ITPL Main Rd, Whitefield, Bengaluru, Karnataka 560066', 0),
('Jayanagar', 'South Bengaluru', 'Bengaluru', '560041', '4th Block, 11th Main, Jayanagar, Bengaluru, Karnataka 560041', 0),
('Malleshwaram', 'North-West Bengaluru', 'Bengaluru', '560003', 'Sampige Road, Malleshwaram, Bengaluru, Karnataka 560003', 0),
('Bellandur', 'South-East Bengaluru', 'Bengaluru', '560103', 'Green Glen Layout, Bellandur, Bengaluru, Karnataka 560103', 0),
('Electronic City', 'South Bengaluru', 'Bengaluru', '560100', 'Phase 1, Electronic City, Bengaluru, Karnataka 560100', 0);

-- 6. Popular Services in Bangalore
INSERT INTO popular_tags (tag_name, category_slug, search_query, display_order) VALUES
('Urbab Pure RO Purifier', 'native-water-purifier', 'water purifier', 1),
('Urbab Bio Smart Locks', 'native-smart-locks', 'smart locks', 2),
('Full Home / Room Cleaning', 'cleaning-pest-control', 'full home cleaning', 3),
('Gas Stove Flame Service', 'ac-appliance-repair', 'gas stove', 4),
('Laptop Hardware Repair', 'ac-appliance-repair', 'laptop', 5),
('Women''s Hair Studio', 'womens-salon-spa', 'haircut women', 6),
('AC Powerjet Service', 'ac-appliance-repair', 'ac service', 7),
('Threading & Eyebrow', 'womens-salon-spa', 'threading', 8),
('Intense Bathroom Scrubbing', 'cleaning-pest-control', 'bathroom cleaning', 9),
('Plumbing & Tap Repair', 'electrician-plumber-carpenter', 'tap repair', 10),
('Wall Drilling (Per Hole)', 'electrician-plumber-carpenter', 'drill', 11),
('Modular Switch Installation', 'electrician-plumber-carpenter', 'switch', 12),
('Ceiling Fan Cleaning', 'cleaning-pest-control', 'fan cleaning', 13),
('Odorless Cockroach Control', 'cleaning-pest-control', 'pest control', 14),
('French Cirepil Face Wax', 'womens-salon-spa', 'face wax', 15),
('Swedish Stress Relief Massage', 'womens-salon-spa', 'swedish massage', 16),
('Sublime Swedish Massage (Luxe)', 'womens-salon-spa', 'massage luxe', 17),
('Washing Machine Repair', 'ac-appliance-repair', 'washing machine', 18),
('RO Purifier Service', 'ac-appliance-repair', 'purifier service', 19),
('Water Geyser Safety Check', 'ac-appliance-repair', 'geyser', 20),
('Designer Wall Panels', 'wall-makeover', 'wall panels', 21),
('Double Bed Assembly', 'electrician-plumber-carpenter', 'bed assembly', 22),
('Men''s Deep Tissue Massage', 'mens-salon-massage', 'deep tissue', 23),
('Hot Basalt Stone Therapy', 'mens-salon-massage', 'healing therapy', 24),
('Ayurvedic Abhyangam Massage', 'mens-salon-massage', 'abhyangam', 25),
('Precision Men''s Haircut', 'mens-salon-massage', 'haircut men', 26),
('Executive Complete Grooming', 'mens-salon-massage', 'grooming', 27);
