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
