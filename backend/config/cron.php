<?php

require_once __DIR__ . '/env.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/../model/web/BannedModel.php';

loadEnv(__DIR__ . '/../.env');

date_default_timezone_set('UTC');

$isCli = (php_sapi_name() === 'cli' || empty($_SERVER['REMOTE_ADDR']));
$isLoop = $isCli && (in_array('--loop', $argv ?? []) || in_array('--daemon', $argv ?? []));
$interval = 60;

foreach ($argv ?? [] as $arg) {
    if (strpos($arg, '--interval=') === 0) {
        $interval = max(5, (int)substr($arg, 11));
    }
}

if (!$isCli) {
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Cron-Secret');

    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }

    $cronSecret = getenv('BAN_CRON_SECRET') ?: 'local-ban-cron';

    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $providedSecret = $_GET['secret'] 
        ?? $_POST['secret'] 
        ?? ($headers['X-Cron-Secret'] ?? $headers['x-cron-secret'] ?? null);

    if (!$providedSecret && !empty($headers['Authorization'])) {
        if (preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $m)) {
            $providedSecret = trim($m[1]);
        }
    }

    if (!$providedSecret) {
        $body = json_decode(file_get_contents('php://input'), true);
        if (!empty($body['secret'])) {
            $providedSecret = $body['secret'];
        }
    }

    if ($cronSecret && $providedSecret !== $cronSecret) {
        require_once __DIR__ . '/jwt.php';
        $isAdmin = false;
        if (!empty($headers['Authorization']) && preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $m)) {
            $tok = trim($m[1]);
            if (JWT::validate($tok)) {
                $isAdmin = true;
            }
        }

        if (!$isAdmin) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Unauthorized: Invalid cron secret or authorization'
            ]);
            exit();
        }
    }
}

function runCleanup($isCli) {
    $db = Database::getInstance();
    $conn = $db->getConnection();
    if (!$conn) {
        throw new Exception("Database connection could not be established");
    }

    $bannedModel = new BannedModel();
    $cleanedCount = $bannedModel->cleanupExpiredBans();

    $response = [
        'success' => true,
        'message' => "Expired bans cleaned up successfully.",
        'unbanned_count' => $cleanedCount,
        'timestamp' => gmdate('Y-m-d\TH:i:s\Z')
    ];

    if ($isCli) {
        $platform = getenv('RENDER') ? '[Render Cron]' : '[Cron]';
        echo "[" . gmdate('Y-m-d H:i:s') . " UTC] {$platform} Ban cleanup executed. Deactivated {$cleanedCount} expired bans.\n";
    } else {
        http_response_code(200);
        echo json_encode($response);
    }

    return $cleanedCount;
}

if ($isLoop) {
    echo "[" . gmdate('Y-m-d H:i:s') . " UTC] Starting Ban Cleanup Daemon (interval: {$interval}s)...\n";
    while (true) {
        try {
            runCleanup(true);
        } catch (Throwable $e) {
            echo "[" . gmdate('Y-m-d H:i:s') . " UTC] Error in daemon loop: " . $e->getMessage() . "\n";
        }
        sleep($interval);
    }
} else {
    try {
        runCleanup($isCli);
        if ($isCli) {
            exit(0);
        }
    } catch (Throwable $e) {
        $error = [
            'success' => false,
            'message' => 'Cron execution failed: ' . $e->getMessage()
        ];
        if ($isCli) {
            echo "[" . gmdate('Y-m-d H:i:s') . " UTC] Error: " . $e->getMessage() . "\n";
            exit(1);
        } else {
            http_response_code(500);
            echo json_encode($error);
        }
    }
}
