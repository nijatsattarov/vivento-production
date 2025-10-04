#!/bin/bash
# Vivento PHP Backend Deployment for Shared Hosting

echo "🚀 Vivento PHP Deployment başladı..."

# 1. PHP Backend yaradır
mkdir -p php_backend
cd php_backend

# Database config
cat > config.php << 'EOF'
<?php
// Shared hosting database config
$servername = "localhost";
$username = "your_username";  // cPanel-dən alacağınız
$password = "your_password";  // cPanel-dən alacağınız  
$dbname = "your_dbname";      // cPanel-dən yaradacağınız

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die("Connection failed: " . $e->getMessage());
}

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}
?>
EOF

# API endpoints
cat > api/auth/register.php << 'EOF'
<?php
require_once '../../config.php';

$input = json_decode(file_get_contents('php://input'), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $input['email'];
    $password = password_hash($input['password'], PASSWORD_DEFAULT);
    $name = $input['name'];
    
    $stmt = $pdo->prepare("INSERT INTO users (email, password, name) VALUES (?, ?, ?)");
    
    try {
        $stmt->execute([$email, $password, $name]);
        echo json_encode([
            'success' => true,
            'user' => ['email' => $email, 'name' => $name],
            'token' => base64_encode($email . ':' . time())
        ]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Email already exists']);
    }
}
?>
EOF

cat > api/auth/login.php << 'EOF'
<?php
require_once '../../config.php';

$input = json_decode(file_get_contents('php://input'), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $input['email'];
    $password = $input['password'];
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if ($user && password_verify($password, $user['password'])) {
        echo json_encode([
            'success' => true,
            'user' => ['email' => $user['email'], 'name' => $user['name']],
            'access_token' => base64_encode($email . ':' . time())
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Invalid credentials']);
    }
}
?>
EOF

# Events API
cat > api/events/index.php << 'EOF'
<?php
require_once '../../config.php';

$headers = apache_request_headers();
$token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : '';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare("SELECT * FROM events ORDER BY created_at DESC");
    $stmt->execute();
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($events);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $stmt = $pdo->prepare("INSERT INTO events (name, date, location, map_link, additional_notes) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([
        $input['name'],
        $input['date'], 
        $input['location'],
        $input['map_link'] ?? null,
        $input['additional_notes'] ?? null
    ]);
    
    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
}
?>
EOF

# Database creation script
cat > create_database.sql << 'EOF'
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT 1,
    name VARCHAR(255) NOT NULL,
    date DATETIME NOT NULL,
    location TEXT NOT NULL,
    map_link TEXT,
    additional_notes TEXT,
    custom_design JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE guests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    unique_token VARCHAR(255) UNIQUE,
    rsvp_status ENUM('gəlirəm', 'gəlmirəm'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id)
);

INSERT INTO users (email, password, name) VALUES 
('admin@vivento.az', '$2y$10$hash_here', 'Admin User');
EOF

echo "✅ PHP Backend hazırdır!"
echo ""
echo "📋 Shared Hosting Setup:"
echo "1. cPanel → MySQL Databases → Create Database"
echo "2. Database user yaradın və assign edin"
echo "3. phpMyAdmin → SQL → create_database.sql run edin"
echo "4. config.php-də database credentials update edin"
echo "5. Bütün faylları public_html-ə upload edin"