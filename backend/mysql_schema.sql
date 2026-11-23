-- Urbab366 Bangalore MySQL Database Schema
USE urbab366_db;

DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS popular_tags;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS curations;
DROP TABLE IF EXISTS banners;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS categories;

-- Categories
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    icon_type VARCHAR(100) NOT NULL,
    badge VARCHAR(50),
    group_type VARCHAR(50) DEFAULT 'regular',
    display_order INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Services
CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    rating DECIMAL(3,2) NOT NULL,
    review_count VARCHAR(50) NOT NULL,
    duration_mins INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    is_luxe TINYINT(1) DEFAULT 0,
    image_url TEXT NOT NULL,
    section_group VARCHAR(100) NOT NULL,
    description TEXT,
    features TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Banners & Carousels
CREATE TABLE banners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- 'hero', 'spotlight', 'feature', 'branded'
    eyebrow VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    badge VARCHAR(50),
    cta_text VARCHAR(100) NOT NULL,
    cta_link VARCHAR(255),
    image_url TEXT NOT NULL,
    bg_gradient VARCHAR(255),
    display_order INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thoughtful Curations / Story Reels
CREATE TABLE curations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    image_url TEXT NOT NULL,
    video_duration VARCHAR(20) DEFAULT '0:30',
    display_order INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Locations in Bangalore
CREATE TABLE locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    area_name VARCHAR(150) NOT NULL,
    locality VARCHAR(150) NOT NULL,
    city VARCHAR(100) DEFAULT 'Bengaluru',
    pincode VARCHAR(20) NOT NULL,
    address_line TEXT NOT NULL,
    is_default TINYINT(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Popular Services in Bangalore (Tag Cloud)
CREATE TABLE popular_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tag_name VARCHAR(150) NOT NULL,
    category_slug VARCHAR(150),
    search_query VARCHAR(150),
    display_order INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shopping / Booking Cart
CREATE TABLE cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    quantity INT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bookings Orders
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255),
    address TEXT NOT NULL,
    scheduled_date VARCHAR(100) NOT NULL,
    scheduled_time VARCHAR(100) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(100) DEFAULT 'Cash on Delivery',
    items_json JSON NOT NULL,
    status VARCHAR(50) DEFAULT 'Confirmed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Laborers & Preferred Localities
CREATE TABLE laborers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    service_category VARCHAR(100) NOT NULL,
    preferred_localities TEXT NOT NULL,
    experience_years INT DEFAULT 1,
    availability_status VARCHAR(50) DEFAULT 'Available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
