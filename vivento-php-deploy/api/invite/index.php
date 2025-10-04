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
