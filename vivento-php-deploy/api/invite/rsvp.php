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
