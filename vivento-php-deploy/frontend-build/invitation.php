<?php
// Invitation Display Page
require_once '../config.php';

$token = $_GET['token'] ?? '';
if (empty($token)) {
    die('Invalid invitation token');
}

// Get invitation data
try {
    // Handle demo invitations
    if (strpos($token, 'demo-') === 0) {
        $event_id = str_replace('demo-', '', $token);
        
        $stmt = $GLOBALS['pdo']->prepare("SELECT * FROM events WHERE id = ?");
        $stmt->execute([$event_id]);
        $event = $stmt->fetch();
        
        if (!$event) {
            die('Event not found');
        }
        
        // Convert custom_design JSON
        if ($event['custom_design']) {
            $event['custom_design'] = json_decode($event['custom_design'], true);
        }
        
        // Demo guest
        $guest = [
            'id' => 'demo-guest',
            'name' => 'Demo Qonaq',
            'rsvp_status' => null
        ];
    } else {
        // Real invitation
        $stmt = $GLOBALS['pdo']->prepare("SELECT * FROM guests WHERE unique_token = ?");
        $stmt->execute([$token]);
        $guest = $stmt->fetch();
        
        if (!$guest) {
            die('Invitation not found');
        }
        
        $stmt = $GLOBALS['pdo']->prepare("SELECT * FROM events WHERE id = ?");
        $stmt->execute([$guest['event_id']]);
        $event = $stmt->fetch();
        
        if ($event['custom_design']) {
            $event['custom_design'] = json_decode($event['custom_design'], true);
        }
    }
} catch (Exception $e) {
    die('Database error');
}

$eventDateTime = date('l, F j, Y \a\t g:i A', strtotime($event['date']));
?>
<!DOCTYPE html>
<html lang="az">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($event['name']); ?> - Dəvətnamə</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        .custom-design-canvas {
            position: relative;
            margin: 0 auto;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .design-element {
            position: absolute;
        }
        
        .glass {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
        }
    </style>
</head>
<body class="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
    <!-- Background decoration -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full opacity-20 blur-3xl"></div>
        <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-200 to-purple-200 rounded-full opacity-20 blur-3xl"></div>
    </div>

    <div class="relative z-10 max-w-4xl mx-auto">
        <!-- Custom Template Design -->
        <?php if (isset($event['custom_design']) && !empty($event['custom_design']['elements'])): ?>
        <div class="mb-8 text-center">
            <h2 class="text-2xl font-bold text-center mb-6 text-gray-800">Dəvətnaməniz</h2>
            <div class="custom-design-canvas" 
                 style="width: <?php echo $event['custom_design']['canvasSize']['width'] ?? 400; ?>px; 
                        height: <?php echo $event['custom_design']['canvasSize']['height'] ?? 600; ?>px;
                        background-color: <?php echo $event['custom_design']['canvasSize']['background'] ?? '#ffffff'; ?>;
                        <?php if (!empty($event['custom_design']['canvasSize']['backgroundImage'])): ?>
                        background-image: url(<?php echo $event['custom_design']['canvasSize']['backgroundImage']; ?>);
                        background-size: cover;
                        background-position: center;
                        background-repeat: no-repeat;
                        <?php endif; ?>">
                
                <?php foreach ($event['custom_design']['elements'] as $element): ?>
                <div class="design-element"
                     style="left: <?php echo $element['x']; ?>px;
                            top: <?php echo $element['y']; ?>px;
                            width: <?php echo $element['width']; ?>px;
                            height: <?php echo $element['height']; ?>px;
                            transform: rotate(<?php echo $element['rotation'] ?? 0; ?>deg);">
                    
                    <?php if ($element['type'] === 'text'): ?>
                    <div style="font-size: <?php echo $element['fontSize']; ?>px;
                               font-family: <?php echo $element['fontFamily'] ?? 'Inter'; ?>;
                               color: <?php echo $element['color'] ?? '#000000'; ?>;
                               font-weight: <?php echo $element['fontWeight'] ?? 'normal'; ?>;
                               text-align: <?php echo $element['textAlign'] ?? 'center'; ?>;
                               width: 100%;
                               height: 100%;
                               display: flex;
                               align-items: center;
                               justify-content: <?php 
                                   echo $element['textAlign'] === 'center' ? 'center' : 
                                       ($element['textAlign'] === 'right' ? 'flex-end' : 'flex-start'); 
                               ?>;
                               white-space: pre-line;
                               line-height: <?php echo $element['lineHeight'] ?? 1.4; ?>;">
                        <?php echo htmlspecialchars($element['content']); ?>
                    </div>
                    <?php elseif ($element['type'] === 'image'): ?>
                    <img src="<?php echo $element['src']; ?>" 
                         alt="Design element"
                         class="w-full h-full object-cover"
                         style="border-radius: <?php echo $element['borderRadius'] ?? 0; ?>px;">
                    <?php endif; ?>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endif; ?>

        <!-- Main Invitation Card -->
        <div class="glass border-0 shadow-2xl overflow-hidden rounded-lg">
            <!-- Header -->
            <div class="relative bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-white">
                <div class="relative z-10 text-center space-y-4">
                    <div class="flex justify-center mb-4">
                        <i class="fas fa-heart text-pink-200 text-5xl"></i>
                    </div>
                    <h1 class="text-3xl md:text-4xl font-bold">
                        <?php echo htmlspecialchars($event['name']); ?>
                    </h1>
                    <p class="text-purple-100 text-lg">
                        Hörmətli <span class="font-semibold"><?php echo htmlspecialchars($guest['name']); ?></span>,
                    </p>
                    <p class="text-purple-100">
                        Tədbirimizə dəvətlisiniz!
                    </p>
                </div>
            </div>

            <!-- Event Details -->
            <div class="p-8 space-y-8">
                <div class="space-y-6">
                    <div class="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-calendar text-blue-600"></i>
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-900 mb-1">Tarix və vaxt</h3>
                            <p class="text-gray-700 font-medium"><?php echo $eventDateTime; ?></p>
                        </div>
                    </div>

                    <div class="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
                        <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-map-marker-alt text-purple-600"></i>
                        </div>
                        <div class="flex-1">
                            <h3 class="font-semibold text-gray-900 mb-1">Yer</h3>
                            <p class="text-gray-700 font-medium"><?php echo htmlspecialchars($event['location']); ?></p>
                            <?php if (!empty($event['map_link'])): ?>
                            <a href="<?php echo htmlspecialchars($event['map_link']); ?>" 
                               target="_blank"
                               class="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center mt-2">
                                <i class="fas fa-external-link-alt mr-1"></i>
                                Xəritədə gör
                            </a>
                            <?php endif; ?>
                        </div>
                    </div>

                    <?php if (!empty($event['additional_notes'])): ?>
                    <div class="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <h3 class="font-semibold text-amber-900 mb-2">Əlavə məlumat</h3>
                        <p class="text-amber-800"><?php echo nl2br(htmlspecialchars($event['additional_notes'])); ?></p>
                    </div>
                    <?php endif; ?>
                </div>

                <!-- RSVP Section -->
                <?php if (!strpos($token, 'demo-')): ?>
                <div class="border-t pt-8">
                    <?php if (empty($guest['rsvp_status'])): ?>
                    <div class="text-center space-y-6">
                        <div class="space-y-2">
                            <h2 class="text-2xl font-bold text-gray-900">Gələcəksinizmi?</h2>
                            <p class="text-gray-600">Xahiş edirik cavabınızı bildirin</p>
                        </div>
                        
                        <div class="flex flex-col sm:flex-row gap-4 justify-center">
                            <button onclick="rsvp('gəlirəm')"
                                    class="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 text-lg rounded-lg">
                                <i class="fas fa-check-circle mr-2"></i>
                                Bəli, gələcəm! 🎉
                            </button>
                            
                            <button onclick="rsvp('gəlmirəm')"
                                    class="border border-red-300 text-red-600 hover:bg-red-50 px-8 py-3 text-lg rounded-lg">
                                <i class="fas fa-times-circle mr-2"></i>
                                Təəssüf ki, gələ bilməm 😔
                            </button>
                        </div>
                    </div>
                    <?php else: ?>
                    <div class="text-center space-y-4">
                        <div class="w-16 h-16 mx-auto rounded-full flex items-center justify-center <?php echo $guest['rsvp_status'] === 'gəlirəm' ? 'bg-green-100' : 'bg-red-100'; ?>">
                            <?php if ($guest['rsvp_status'] === 'gəlirəm'): ?>
                            <i class="fas fa-check-circle text-green-600 text-2xl"></i>
                            <?php else: ?>
                            <i class="fas fa-times-circle text-red-600 text-2xl"></i>
                            <?php endif; ?>
                        </div>
                        
                        <div>
                            <h2 class="text-2xl font-bold text-gray-900">Təşəkkür edirik!</h2>
                            <p class="text-lg font-medium <?php echo $guest['rsvp_status'] === 'gəlirəm' ? 'text-green-700' : 'text-red-700'; ?>">
                                <?php echo $guest['rsvp_status'] === 'gəlirəm' ? 'Sizin iştirakınızı gözləyirik! 🎉' : 'Cavabınız qeydə alındı. Başqa vaxt görüşək! 😊'; ?>
                            </p>
                        </div>
                    </div>
                    <?php endif; ?>
                </div>
                <?php else: ?>
                <div class="text-center p-6 bg-blue-50 rounded-lg">
                    <p class="text-blue-800 font-medium">
                        <i class="fas fa-info-circle mr-2"></i>
                        Bu dəvətnamənin demo versiyasıdır
                    </p>
                </div>
                <?php endif; ?>
            </div>
        </div>

        <!-- Footer -->
        <div class="text-center mt-8 text-gray-500">
            <p class="text-sm">
                Bu dəvətnamə <span class="font-semibold text-purple-600">Vivento</span> ilə yaradılıb
            </p>
        </div>
    </div>

    <script>
        async function rsvp(status) {
            try {
                const response = await fetch(`/api/invite/rsvp.php?token=<?php echo $token; ?>`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status })
                });
                
                if (response.ok) {
                    location.reload();
                } else {
                    alert('Cavab verə bilmədi. Yenidən cəhd edin.');
                }
            } catch (error) {
                alert('Xəta baş verdi: ' + error.message);
            }
        }
    </script>
</body>
</html>
