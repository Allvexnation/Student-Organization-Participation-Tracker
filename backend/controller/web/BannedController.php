<?php

require_once __DIR__ . '/../../model/web/BannedModel.php';
require_once __DIR__ . '/../../model/SessionModel.php';
require_once __DIR__ . '/../../config/jwt.php';
require_once __DIR__ . '/../../config/db.php';

date_default_timezone_set('UTC');

class BannedController {
    private $bannedModel;
    private $sessionModel;
    private $conn;

    public function __construct() {
        $this->bannedModel = new BannedModel();
        $this->sessionModel = new SessionModel();
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
    }

    private function getClientIp() {
        $ip = '';

        if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
            $ip = $_SERVER['HTTP_CF_CONNECTING_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
        } elseif (!empty($_SERVER['HTTP_X_REAL_IP'])) {
            $ip = $_SERVER['HTTP_X_REAL_IP'];
        } elseif (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            $ip = $_SERVER['HTTP_CLIENT_IP'];
        } else {
            $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        }

        if (strpos($ip, ',') !== false) {
            $ips = explode(',', $ip);
            $ip = trim($ips[0]);
        }

        return trim($ip);
    }

    private function validateAdmin() {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        $token = null;
        if ($authHeader && preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $token = trim($matches[1]);
        }

        if (!$token || !JWT::validate($token)) {
            return false;
        }

        return JWT::getUserId($token);
    }

    public function createBan() {
        header('Content-Type: application/json');

        $adminId = $this->validateAdmin();
        if (!$adminId) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data || !isset($data['ban_type']) || !isset($data['reason'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $banType = $data['ban_type'];
        $banData = [
            'ban_type' => $banType,
            'reason' => trim($data['reason']),
            'banned_by' => $adminId,
            'ban_duration_type' => $data['ban_duration_type'] ?? 'permanent',
            'expires_at' => null,
            'target_type' => $data['target_type'] ?? null,
            'target_id' => !empty($data['target_id']) ? (int)$data['target_id'] : null,
            'session_id' => !empty($data['session_id']) ? (int)$data['session_id'] : null,
            'ip_address' => !empty($data['ip_address']) ? trim($data['ip_address']) : null
        ];

        if ($banType === 'session') {
            if (empty($data['session_id'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Session ID is required for session ban']);
                return;
            }

            $stmt = $this->conn->prepare("SELECT * FROM sessions WHERE id = :id LIMIT 1");
            $stmt->bindParam(':id', $data['session_id']);
            $stmt->execute();
            $sessionData = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$sessionData) {
                http_response_code(404);
                echo json_encode(['message' => 'Session not found']);
                return;
            }

            $banData['session_id'] = (int)$data['session_id'];
            $banData['target_type'] = $sessionData['user_type'];
            $banData['target_id'] = (int)$sessionData['user_id'];
            $banData['ip_address'] = $sessionData['ip_address'] ?? null;
            if (empty($banData['ip_address'])) {
                $banData['ip_address'] = !empty($data['ip_address']) ? trim($data['ip_address']) : $this->getClientIp();
            }

        } elseif ($banType === 'overall') {
            if (empty($data['target_type']) || empty($data['target_id'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Target type and target ID are required for overall ban']);
                return;
            }

            $banData['target_type'] = $data['target_type'];
            $banData['target_id'] = (int)$data['target_id'];

            if (!empty($data['session_id'])) {
                $stmt = $this->conn->prepare("SELECT * FROM sessions WHERE id = :id LIMIT 1");
                $stmt->bindParam(':id', $data['session_id']);
                $stmt->execute();
                $sessionData = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($sessionData) {
                    $banData['session_id'] = (int)$data['session_id'];
                    if (empty($banData['ip_address'])) {
                        $banData['ip_address'] = $sessionData['ip_address'];
                    }
                }
            }

        } elseif ($banType === 'ip') {
            if (empty($data['ip_address'])) {
                http_response_code(400);
                echo json_encode(['message' => 'IP address is required for IP ban']);
                return;
            }

            $banData['ip_address'] = trim($data['ip_address']);
            $banData['ban_type'] = 'ip';
        }

        if ($banData['ban_duration_type'] === 'temporary') {
            if (empty($data['expires_at'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Expiration date is required for temporary ban']);
                return;
            }
            $banData['expires_at'] = $data['expires_at'];
        }

        $result = $this->bannedModel->create($banData);

        if ($result) {
            http_response_code(201);
            echo json_encode(['message' => 'Ban created successfully', 'id' => $result]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to create ban']);
        }
    }

    public function updateBan($banId) {
        header('Content-Type: application/json');

        $adminId = $this->validateAdmin();
        if (!$adminId) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid data']);
            return;
        }

        $result = $this->bannedModel->update($banId, $data);

        if ($result) {
            http_response_code(200);
            echo json_encode(['message' => 'Ban updated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update ban']);
        }
    }

    public function checkBan() {
        header('Content-Type: application/json');

        $this->bannedModel->cleanupExpiredBans();

        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        $token = null;
        if ($authHeader && preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $token = trim($matches[1]);
        } elseif (!empty($data['token'])) {
            $token = trim($data['token']);
        }

        $targetType = !empty($data['target_type']) ? $data['target_type'] : null;
        $targetId = !empty($data['target_id']) ? (int)$data['target_id'] : null;
        $sessionId = !empty($data['session_id']) ? (int)$data['session_id'] : null;

        if ($token && (!$targetType || !$targetId || !$sessionId)) {
            try {
                $stmt = $this->conn->prepare("SELECT id, user_id, user_type, ip_address FROM sessions WHERE token = :token LIMIT 1");
                $stmt->bindParam(':token', $token);
                $stmt->execute();
                $session = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($session) {
                    if (!$sessionId) $sessionId = (int)$session['id'];
                    if (!$targetType) $targetType = $session['user_type'];
                    if (!$targetId) $targetId = (int)$session['user_id'];
                    if (empty($reqIp) && !empty($session['ip_address'])) {
                        $reqIp = $session['ip_address'];
                    }
                }
            } catch (Exception $e) {}

            if ((!$targetType || !$targetId) && JWT::validate($token)) {
                $payload = JWT::decode($token);
                if ($payload) {
                    if (!$targetId && !empty($payload['user_id'])) $targetId = (int)$payload['user_id'];
                    if (!$targetType && !empty($payload['role'])) $targetType = $payload['role'];
                }
            }
        }

        $clientIp = $this->getClientIp();
        $reqIp = !empty($data['ip_address']) ? trim($data['ip_address']) : $reqIp;
        $ipCandidates = array_values(array_filter([$reqIp, $clientIp]));

        $ban = $this->bannedModel->findActiveBan($targetType, $targetId, $sessionId, $ipCandidates);

        if ($ban) {
            http_response_code(200);
            echo json_encode(['banned' => true, 'ban_info' => $ban]);
        } else {
            http_response_code(200);
            echo json_encode(['banned' => false]);
        }
    }

    public function checkOverallBan() {
        header('Content-Type: application/json');

        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data || !isset($data['target_type']) || !isset($data['target_id'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Target type and target ID are required']);
            return;
        }

        $ipAddress = !empty($data['ip_address']) ? trim($data['ip_address']) : $this->getClientIp();
        $ban = $this->bannedModel->checkOverallBan($data['target_type'], (int)$data['target_id'], $ipAddress);

        if ($ban) {
            http_response_code(200);
            echo json_encode(['banned' => true, 'ban_info' => $ban]);
        } else {
            http_response_code(200);
            echo json_encode(['banned' => false]);
        }
    }

    public function getBanInfo() {
        header('Content-Type: application/json');

        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $sessionId = !empty($data['session_id']) ? (int)$data['session_id'] : null;
        $ipAddress = !empty($data['ip_address']) ? trim($data['ip_address']) : $this->getClientIp();
        $targetType = $data['target_type'] ?? null;
        $targetId = !empty($data['target_id']) ? (int)$data['target_id'] : null;

        $ban = $this->bannedModel->getBanInfo($sessionId, $ipAddress, $targetType, $targetId);

        if ($ban) {
            http_response_code(200);
            echo json_encode(['ban' => $ban]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'No active ban found']);
        }
    }

    public function getAllBans() {
        header('Content-Type: application/json');

        $adminId = $this->validateAdmin();
        if (!$adminId) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $bans = $this->bannedModel->getAllBans();

        if ($bans !== false) {
            http_response_code(200);
            echo json_encode(['bans' => $bans]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to fetch bans']);
        }
    }

    public function deactivateBan($banId) {
        header('Content-Type: application/json');

        $adminId = $this->validateAdmin();
        if (!$adminId) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $result = $this->bannedModel->deactivateBan($banId);

        if ($result) {
            http_response_code(200);
            echo json_encode(['message' => 'Ban deactivated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to deactivate ban']);
        }
    }

    public function activateBan($banId) {
        header('Content-Type: application/json');

        $adminId = $this->validateAdmin();
        if (!$adminId) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $result = $this->bannedModel->activateBan($banId);

        if ($result) {
            http_response_code(200);
            echo json_encode(['message' => 'Ban activated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to activate ban']);
        }
    }

    public function getSessions() {
        header('Content-Type: application/json');

        $adminId = $this->validateAdmin();
        if (!$adminId) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $query = "SELECT s.*, 
                  CASE 
                    WHEN s.user_type = 'admin' THEN (SELECT name FROM admins WHERE id = s.user_id)
                    WHEN s.user_type = 'adviser' THEN (SELECT name FROM advisers WHERE id = s.user_id)
                    WHEN s.user_type = 'student' THEN (SELECT CONCAT(first_name, ' ', last_name) FROM students WHERE id = s.user_id)
                    ELSE NULL
                  END as user_name
                  FROM sessions s
                  WHERE s.is_active = 1
                  ORDER BY s.created_at DESC
                  LIMIT 100";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode(['sessions' => $sessions]);
        } catch(PDOException $e) {
            error_log("Error getting sessions: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['message' => 'Failed to fetch sessions']);
        }
    }

    public function cleanupExpiredBans() {
        header('Content-Type: application/json');

        $result = $this->bannedModel->cleanupExpiredBans();

        if ($result !== false) {
            http_response_code(200);
            echo json_encode(['message' => 'Expired bans cleaned up successfully', 'count' => $result]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to cleanup expired bans']);
        }
    }

    public function deleteBan($banId) {
        header('Content-Type: application/json');

        $adminId = $this->validateAdmin();
        if (!$adminId) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $result = $this->bannedModel->deleteBan($banId);

        if ($result) {
            http_response_code(200);
            echo json_encode(['message' => 'Ban deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to delete ban']);
        }
    }
}
