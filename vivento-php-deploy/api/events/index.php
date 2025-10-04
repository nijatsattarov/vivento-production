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
