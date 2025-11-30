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
