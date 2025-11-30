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
