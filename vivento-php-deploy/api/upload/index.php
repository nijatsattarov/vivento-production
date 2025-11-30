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
