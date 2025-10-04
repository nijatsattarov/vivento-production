-- Vivento Database Setup for Shared Hosting
-- Bu SQL-i phpMyAdmin-də run edin

CREATE DATABASE IF NOT EXISTS vivento_db 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE vivento_db;

-- Users table
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    facebook_id VARCHAR(100) NULL,
    google_id VARCHAR(100) NULL,
    profile_picture TEXT NULL,
    is_active TINYINT(1) DEFAULT 1,
    subscription_type ENUM('free', 'premium', 'vip') DEFAULT 'free',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_subscription (subscription_type)
);

-- Events table
CREATE TABLE events (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    date DATETIME NOT NULL,
    location TEXT NOT NULL,
    map_link TEXT NULL,
    additional_notes TEXT NULL,
    template_id VARCHAR(50) NULL,
    custom_design JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_date (date)
);

-- Templates table
CREATE TABLE templates (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category ENUM('toy', 'nişan', 'doğum_günü', 'korporativ') NOT NULL,
    thumbnail_url TEXT NULL,
    design_data JSON NOT NULL,
    is_premium TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_premium (is_premium)
);

-- Guests table
CREATE TABLE guests (
    id VARCHAR(50) PRIMARY KEY,
    event_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NULL,
    email VARCHAR(255) NULL,
    unique_token VARCHAR(255) UNIQUE NOT NULL,
    rsvp_status ENUM('gəlirəm', 'gəlmirəm') NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    INDEX idx_event_id (event_id),
    INDEX idx_token (unique_token),
    INDEX idx_rsvp (rsvp_status)
);

-- Insert sample admin user
INSERT INTO users (id, email, password, name, subscription_type) VALUES 
(
    'admin-user-001', 
    'admin@vivento.az', 
    '$2y$10$YourHashedPasswordHere',  -- You need to hash this
    'Admin User', 
    'vip'
);

-- Insert sample templates
INSERT INTO templates (id, name, category, thumbnail_url, design_data, is_premium) VALUES 
(
    'template-001',
    'Elegant Wedding',
    'toy',
    '/images/elegant-wedding.jpg',
    '{
        "canvasSize": {
            "width": 400,
            "height": 600,
            "background": "#f8f4e6",
            "backgroundImage": ""
        },
        "elements": [
            {
                "id": "title-1",
                "type": "text",
                "content": "Toy Mərasimi",
                "x": 100,
                "y": 150,
                "width": 200,
                "height": 40,
                "fontSize": 24,
                "fontFamily": "Playfair Display",
                "color": "#8B4513",
                "fontWeight": "bold",
                "textAlign": "center"
            }
        ]
    }',
    0
),
(
    'template-002',
    'Modern Nişan',
    'nişan',
    '/images/modern-engagement.jpg',
    '{
        "canvasSize": {
            "width": 400,
            "height": 600,
            "background": "#ffeaa7",
            "backgroundImage": ""
        },
        "elements": [
            {
                "id": "title-1",
                "type": "text", 
                "content": "Nişan Mərasimi",
                "x": 100,
                "y": 200,
                "width": 200,
                "height": 40,
                "fontSize": 22,
                "fontFamily": "Montserrat",
                "color": "#2d3436",
                "fontWeight": "bold",
                "textAlign": "center"
            }
        ]
    }',
    0
);

-- Create indexes for performance
ALTER TABLE events ADD INDEX idx_created_at (created_at);
ALTER TABLE guests ADD INDEX idx_created_at (created_at);
ALTER TABLE templates ADD INDEX idx_name (name);

COMMIT;
