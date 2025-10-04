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
