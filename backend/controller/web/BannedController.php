<?php

require_once __DIR__ . '/../../model/web/BannedModel.php';
require_once __DIR__ . '/../../model/SessionModel.php';
require_once __DIR__ . '/../../config/jwt.php';
require_once __DIR__ . '/../../config/db.php';

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

        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
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

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            return $ip;
        }
        
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {

            if ($ip === '::1' || $ip === '::1/128') {
                return $ip;
            }
            return $ip;
        }
        
        return $ip;
    }

    private function validateAdmin() {
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
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
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid data']);
            return;
        }

        if (!isset($data['ban_type']) || !isset($data['reason'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $banType = $data['ban_type'];
        $banData = [
            'ban_type' => $banType,
            'reason' => $data['reason'],
            'banned_by' => $adminId,
            'ban_duration_type' => $data['ban_duration_type'] ?? 'permanent',
            'expires_at' => null,
            'target_type' => null,
            'target_id' => null,
            'session_id' => null,
            'ip_address' => null
        ];

        if ($banType === 'session') {
            if (!isset($data['session_id'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Session ID is required for session ban']);
                return;
            }

            $session = $this->conn->prepare("SELECT * FROM sessions WHERE id = :id LIMIT 0,1");
            $session->bindParam(':id', $data['session_id']);
            $session->execute();
            $sessionData = $session->fetch(PDO::FETCH_ASSOC);

            if (!$sessionData) {
                http_response_code(404);
                echo json_encode(['message' => 'Session not found']);
                return;
            }

            $banData['session_id'] = $data['session_id'];
            $banData['target_type'] = $sessionData['user_type'];
            $banData['target_id'] = $sessionData['user_id'];
            $banData['ip_address'] = $sessionData['ip_address'];

        } elseif ($banType === 'overall') {
            if (!isset($data['target_type']) || !isset($data['target_id'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Target type and target ID are required for overall ban']);
                return;
            }

            $banData['target_type'] = $data['target_type'];
            $banData['target_id'] = $data['target_id'];

            if (isset($data['session_id'])) {
                $session = $this->conn->prepare("SELECT * FROM sessions WHERE id = :id LIMIT 0,1");
                $session->bindParam(':id', $data['session_id']);
                $session->execute();
                $sessionData = $session->fetch(PDO::FETCH_ASSOC);
                if ($sessionData) {
                    $banData['session_id'] = $data['session_id'];
                    $banData['ip_address'] = $sessionData['ip_address'];
                }
            }

        } elseif ($banType === 'ip') {
            if (!isset($data['ip_address'])) {
                http_response_code(400);
                echo json_encode(['message' => 'IP address is required for IP ban']);
                return;
            }

            $banData['ip_address'] = $data['ip_address'];

            if (isset($data['ip_ban_scope'])) {
                $banData['ban_type'] = $data['ip_ban_scope'];
            }

            if (isset($data['target_type']) && isset($data['target_id'])) {
                $banData['target_type'] = $data['target_type'];
                $banData['target_id'] = $data['target_id'];
            }
        } else {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid ban type']);
            return;
        }

        if ($banData['ban_duration_type'] === 'temporary') {
            if (!isset($data['expires_at'])) {
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

    public function checkBan() {
        header('Content-Type: application/json');

        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data) {
            $data = [];
        }

        $ban = null;
        $ipAddress = $data['ip_address'] ?? $this->getClientIp();

        if ($ipAddress) {
            $ban = $this->bannedModel->checkBanByIP($ipAddress);
        }

        if (!$ban && isset($data['session_id'])) {
            $ban = $this->bannedModel->checkBanBySession($data['session_id'], $ipAddress);
        }

        if (!$ban && isset($data['target_type']) && isset($data['target_id'])) {
            $ban = $this->bannedModel->checkBanByTarget($data['target_type'], $data['target_id']);
        }

        if (!$ban && isset($data['target_type']) && isset($data['target_id'])) {
            $ban = $this->bannedModel->checkOverallBan($data['target_type'], $data['target_id'], $ipAddress);
        }

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

        $ipAddress = $data['ip_address'] ?? $this->getClientIp();
        $ban = $this->bannedModel->checkOverallBan($data['target_type'], $data['target_id'], $ipAddress);

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

        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid data']);
            return;
        }

        $sessionId = $data['session_id'] ?? null;
        $ipAddress = $data['ip_address'] ?? $this->getClientIp();
        $targetType = $data['target_type'] ?? null;
        $targetId = $data['target_id'] ?? null;

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
        
        $adminId = $this->validateAdmin();
        if (!$adminId) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

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
