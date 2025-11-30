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
