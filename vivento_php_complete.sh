#!/bin/bash
# Vivento Complete PHP Deployment for Shared Hosting
# Bu script tam Vivento funksionallığını PHP-də yaradır

echo "🚀 Vivento PHP Shared Hosting Deployment"
echo "========================================"

# Create directory structure
mkdir -p vivento-php-deploy/{api,frontend-build,uploads,admin}
cd vivento-php-deploy

# 1. Database Configuration
cat > config.php << 'EOF'
<?php
// Shared Hosting Database Configuration
// Bu məlumatları cPanel-dən alacaqsınız

$db_config = [
    'host' => 'localhost',
    'username' => 'your_cpanel_username',  // cPanel username
    'password' => 'your_db_password',      // Database password
    'database' => 'your_db_name'           // Database name
];

try {
    $pdo = new PDO(
        "mysql:host={$db_config['host']};dbname={$db_config['database']};charset=utf8", 
        $db_config['username'], 
        $db_config['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch(PDOException $e) {
    die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
}

// CORS Headers
function setCORSHeaders() {
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Max-Age: 86400');
    }
    
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
            header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        
        if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
            header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
        
        exit(0);
    }
}

setCORSHeaders();
header('Content-Type: application/json; charset=utf-8');

// Helper functions
function generateToken($user_id, $email) {
    $payload = base64_encode(json_encode([
        'user_id' => $user_id,
        'email' => $email,
        'exp' => time() + (24 * 60 * 60) // 24 hours
    ]));
    return $payload;
}

function validateToken($token) {
    try {
        $payload = json_decode(base64_decode($token), true);
        if ($payload && $payload['exp'] > time()) {
            return $payload;
        }
        return false;
    } catch (Exception $e) {
        return false;
    }
}

function getAuthUser() {
    $headers = apache_request_headers();
    $auth = $headers['Authorization'] ?? '';
    
    if (strpos($auth, 'Bearer ') === 0) {
        $token = substr($auth, 7);
        return validateToken($token);
    }
    return false;
}

function generateId() {
    return uniqid() . '-' . bin2hex(random_bytes(8));
}

function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function getInput() {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

// Global PDO connection
$GLOBALS['pdo'] = $pdo;
?>
EOF

# 2. Authentication API
mkdir -p api/auth
cat > api/auth/register.php << 'EOF'
<?php
require_once '../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$input = getInput();
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';
$name = trim($input['name'] ?? '');

// Validation
if (empty($email) || empty($password) || empty($name)) {
    jsonResponse(['detail' => 'Bütün sahələr doldurulmalıdır'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['detail' => 'Email formatı düzgün deyil'], 400);
}

try {
    // Check if email exists
    $stmt = $GLOBALS['pdo']->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->fetch()) {
        jsonResponse(['detail' => 'Bu email artıq istifadədədir'], 400);
    }
    
    // Create user
    $user_id = generateId();
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    
    $stmt = $GLOBALS['pdo']->prepare("
        INSERT INTO users (id, email, password, name, created_at) 
        VALUES (?, ?, ?, ?, NOW())
    ");
    
    $stmt->execute([$user_id, $email, $password_hash, $name]);
    
    $token = generateToken($user_id, $email);
    
    jsonResponse([
        'access_token' => $token,
        'token_type' => 'bearer',
        'user' => [
            'id' => $user_id,
            'email' => $email,
            'name' => $name,
            'subscription_type' => 'free',
            'created_at' => date('Y-m-d\TH:i:s\Z')
        ]
    ]);
    
} catch (PDOException $e) {
    jsonResponse(['detail' => 'Qeydiyyat xətası: ' . $e->getMessage()], 500);
}
?>
EOF

cat > api/auth/login.php << 'EOF'
<?php
require_once '../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$input = getInput();
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if (empty($email) || empty($password)) {
    jsonResponse(['detail' => 'Email və parol daxil edilməlidir'], 400);
}

try {
    $stmt = $GLOBALS['pdo']->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($password, $user['password'])) {
        jsonResponse(['detail' => 'Email və ya parol səhvdir'], 401);
    }
    
    $token = generateToken($user['id'], $user['email']);
    
    jsonResponse([
        'access_token' => $token,
        'token_type' => 'bearer',
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'subscription_type' => $user['subscription_type'],
            'created_at' => $user['created_at']
        ]
    ]);
    
} catch (PDOException $e) {
    jsonResponse(['detail' => 'Giriş xətası'], 500);
}
?>
EOF

# 3. Events API
mkdir -p api/events
cat > api/events/index.php << 'EOF'
<?php
require_once '../../config.php';

$user = getAuthUser();
if (!$user) {
    jsonResponse(['detail' => 'Authentication required'], 401);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $GLOBALS['pdo']->prepare("
            SELECT * FROM events WHERE user_id = ? ORDER BY created_at DESC
        ");
        $stmt->execute([$user['user_id']]);
        $events = $stmt->fetchAll();
        
        // Convert custom_design JSON string back to object
        foreach ($events as &$event) {
            if ($event['custom_design']) {
                $event['custom_design'] = json_decode($event['custom_design'], true);
            }
        }
        
        jsonResponse($events);
        
    } catch (PDOException $e) {
        jsonResponse(['detail' => 'Events yüklənə bilmədi'], 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = getInput();
    
    $name = trim($input['name'] ?? '');
    $date = $input['date'] ?? '';
    $location = trim($input['location'] ?? '');
    $map_link = trim($input['map_link'] ?? '');
    $additional_notes = trim($input['additional_notes'] ?? '');
    
    if (empty($name) || empty($date) || empty($location)) {
        jsonResponse(['detail' => 'Ad, tarix və məkan doldurulmalıdır'], 400);
    }
    
    try {
        $event_id = generateId();
        
        $stmt = $GLOBALS['pdo']->prepare("
            INSERT INTO events (id, user_id, name, date, location, map_link, additional_notes, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $event_id, $user['user_id'], $name, $date, 
            $location, $map_link ?: null, $additional_notes ?: null
        ]);
        
        jsonResponse([
            'id' => $event_id,
            'name' => $name,
            'date' => $date,
            'location' => $location,
            'map_link' => $map_link,
            'additional_notes' => $additional_notes,
            'created_at' => date('Y-m-d\TH:i:s\Z')
        ], 201);
        
    } catch (PDOException $e) {
        jsonResponse(['detail' => 'Event yaradıla bilmədi'], 500);
    }
}
?>
EOF

# 4. Single Event API
cat > api/events/detail.php << 'EOF'
<?php
require_once '../../config.php';

$user = getAuthUser();
if (!$user) {
    jsonResponse(['detail' => 'Authentication required'], 401);
}

// Get event ID from URL parameter
$event_id = $_GET['id'] ?? '';
if (empty($event_id)) {
    jsonResponse(['detail' => 'Event ID required'], 400);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $GLOBALS['pdo']->prepare("
            SELECT * FROM events WHERE id = ? AND user_id = ?
        ");
        $stmt->execute([$event_id, $user['user_id']]);
        $event = $stmt->fetch();
        
        if (!$event) {
            jsonResponse(['detail' => 'Event tapılmadı'], 404);
        }
        
        // Convert custom_design JSON
        if ($event['custom_design']) {
            $event['custom_design'] = json_decode($event['custom_design'], true);
        }
        
        jsonResponse($event);
        
    } catch (PDOException $e) {
        jsonResponse(['detail' => 'Event yüklənə bilmədi'], 500);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = getInput();
    
    try {
        $updates = [];
        $params = [];
        
        if (isset($input['name'])) {
            $updates[] = 'name = ?';
            $params[] = $input['name'];
        }
        
        if (isset($input['date'])) {
            $updates[] = 'date = ?';
            $params[] = $input['date'];
        }
        
        if (isset($input['location'])) {
            $updates[] = 'location = ?';
            $params[] = $input['location'];
        }
        
        if (isset($input['map_link'])) {
            $updates[] = 'map_link = ?';
            $params[] = $input['map_link'];
        }
        
        if (isset($input['additional_notes'])) {
            $updates[] = 'additional_notes = ?';
            $params[] = $input['additional_notes'];
        }
        
        if (isset($input['custom_design'])) {
            $updates[] = 'custom_design = ?';
            $params[] = json_encode($input['custom_design']);
        }
        
        if (empty($updates)) {
            jsonResponse(['detail' => 'Heç bir sahə update edilmədi'], 400);
        }
        
        $params[] = $event_id;
        $params[] = $user['user_id'];
        
        $sql = "UPDATE events SET " . implode(', ', $updates) . " WHERE id = ? AND user_id = ?";
        $stmt = $GLOBALS['pdo']->prepare($sql);
        $stmt->execute($params);
        
        jsonResponse(['detail' => 'Event yeniləndi']);
        
    } catch (PDOException $e) {
        jsonResponse(['detail' => 'Event yenilənə bilmədi'], 500);
    }
}
?>
EOF

# 5. Templates API
mkdir -p api/templates
cat > api/templates/index.php << 'EOF'
<?php
require_once '../../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $GLOBALS['pdo']->prepare("SELECT * FROM templates ORDER BY created_at DESC");
        $stmt->execute();
        $templates = $stmt->fetchAll();
        
        // Convert design_data JSON
        foreach ($templates as &$template) {
            if ($template['design_data']) {
                $template['design_data'] = json_decode($template['design_data'], true);
            }
        }
        
        jsonResponse($templates);
        
    } catch (PDOException $e) {
        jsonResponse(['detail' => 'Templates yüklənə bilmədi'], 500);
    }
}

// Admin only - template creation
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = getAuthUser();
    if (!$user || strpos($user['email'], 'admin') === false) {
        jsonResponse(['detail' => 'Admin hüquqları tələb olunur'], 403);
    }
    
    $input = getInput();
    
    try {
        $template_id = generateId();
        
        $stmt = $GLOBALS['pdo']->prepare("
            INSERT INTO templates (id, name, category, thumbnail_url, design_data, is_premium, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        
        $stmt->execute([
            $template_id,
            $input['name'],
            $input['category'],
            $input['thumbnail_url'] ?? '',
            json_encode($input['design_data']),
            $input['is_premium'] ? 1 : 0
        ]);
        
        jsonResponse(['id' => $template_id, 'message' => 'Template yaradıldı'], 201);
        
    } catch (PDOException $e) {
        jsonResponse(['detail' => 'Template yaradıla bilmədi'], 500);
    }
}
?>
EOF

# 6. Invitations API
mkdir -p api/invite
cat > api/invite/index.php << 'EOF'
<?php
require_once '../../config.php';

// Handle both /api/invite/{token} and /api/invite/index.php?token=
$path_info = $_SERVER['PATH_INFO'] ?? '';
$token = '';

if ($path_info) {
    $token = trim($path_info, '/');
} else {
    $token = $_GET['token'] ?? '';
}

if (empty($token)) {
    jsonResponse(['detail' => 'Token required'], 400);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Handle demo invitations
        if (strpos($token, 'demo-') === 0) {
            $event_id = str_replace('demo-', '', $token);
            
            $stmt = $GLOBALS['pdo']->prepare("SELECT * FROM events WHERE id = ?");
            $stmt->execute([$event_id]);
            $event = $stmt->fetch();
            
            if (!$event) {
                jsonResponse(['detail' => 'Tədbir tapılmadı'], 404);
            }
            
            // Convert custom_design JSON
            if ($event['custom_design']) {
                $event['custom_design'] = json_decode($event['custom_design'], true);
            }
            
            // Create demo guest
            $demo_guest = [
                'id' => 'demo-guest',
                'event_id' => $event_id,
                'name' => 'Demo Qonaq',
                'unique_token' => $token,
                'rsvp_status' => null,
                'created_at' => date('Y-m-d\TH:i:s\Z')
            ];
            
            jsonResponse([
                'guest' => $demo_guest,
                'event' => $event
            ]);
        }
        
        // Handle real invitations
        $stmt = $GLOBALS['pdo']->prepare("SELECT * FROM guests WHERE unique_token = ?");
        $stmt->execute([$token]);
        $guest = $stmt->fetch();
        
        if (!$guest) {
            jsonResponse(['detail' => 'Dəvətnamə tapılmadı'], 404);
        }
        
        $stmt = $GLOBALS['pdo']->prepare("SELECT * FROM events WHERE id = ?");
        $stmt->execute([$guest['event_id']]);
        $event = $stmt->fetch();
        
        if (!$event) {
            jsonResponse(['detail' => 'Tədbir tapılmadı'], 404);
        }
        
        // Convert custom_design JSON
        if ($event['custom_design']) {
            $event['custom_design'] = json_decode($event['custom_design'], true);
        }
        
        jsonResponse([
            'guest' => $guest,
            'event' => $event
        ]);
        
    } catch (PDOException $e) {
        jsonResponse(['detail' => 'Dəvətnamə yüklənə bilmədi'], 500);
    }
}
?>
EOF

# 7. RSVP API
cat > api/invite/rsvp.php << 'EOF'
<?php
require_once '../../config.php';

$path_info = $_SERVER['PATH_INFO'] ?? '';
$token = trim($path_info, '/');

if (empty($token)) {
    $token = $_GET['token'] ?? '';
}

if (empty($token) || $_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['detail' => 'Token və POST method lazımdır'], 400);
}

$input = getInput();
$status = $input['status'] ?? '';

if (!in_array($status, ['gəlirəm', 'gəlmirəm'])) {
    jsonResponse(['detail' => 'Status düzgün deyil'], 400);
}

try {
    $stmt = $GLOBALS['pdo']->prepare("
        UPDATE guests SET rsvp_status = ?, responded_at = NOW() 
        WHERE unique_token = ?
    ");
    
    $stmt->execute([$status, $token]);
    
    if ($stmt->rowCount() === 0) {
        jsonResponse(['detail' => 'Dəvətnamə tapılmadı'], 404);
    }
    
    jsonResponse(['message' => 'Cavabınız qeydə alındı']);
    
} catch (PDOException $e) {
    jsonResponse(['detail' => 'RSVP qeydə alına bilmədi'], 500);
}
?>
EOF

# 8. File Upload API  
mkdir -p api/upload
cat > api/upload/index.php << 'EOF'
<?php
require_once '../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['detail' => 'POST method lazımdır'], 405);
}

if (!isset($_FILES['file'])) {
    jsonResponse(['detail' => 'Fayl yüklənmədi'], 400);
}

$file = $_FILES['file'];

// Validation
$allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
if (!in_array($file['type'], $allowed_types)) {
    jsonResponse(['detail' => 'Yalnız şəkil faylları qəbul edilir'], 400);
}

// Size limit: 5MB
if ($file['size'] > 5 * 1024 * 1024) {
    jsonResponse(['detail' => 'Fayl ölçüsü 5MB-dan böyük ola bilməz'], 400);
}

try {
    $upload_dir = '../uploads/';
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }
    
    $file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $unique_filename = uniqid() . '.' . $file_extension;
    $file_path = $upload_dir . $unique_filename;
    
    if (move_uploaded_file($file['tmp_name'], $file_path)) {
        $file_url = '/uploads/' . $unique_filename;
        
        jsonResponse([
            'filename' => $unique_filename,
            'url' => $file_url,
            'message' => 'Şəkil uğurla yükləndi'
        ]);
    } else {
        jsonResponse(['detail' => 'Fayl yüklənə bilmədi'], 500);
    }
    
} catch (Exception $e) {
    jsonResponse(['detail' => 'Upload xətası: ' . $e->getMessage()], 500);
}
?>
EOF

# 9. Database Setup SQL
cat > database_setup.sql << 'EOF'
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
EOF

echo "✅ PHP Backend API hazırdır!"
echo ""
echo "📁 Fayl strukturu:"
find . -name "*.php" -o -name "*.sql" | head -20
echo ""