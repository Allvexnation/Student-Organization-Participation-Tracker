<?php

require_once __DIR__ . '/../model/SessionModel.php';
require_once __DIR__ . '/../config/jwt.php';

class SessionController {
    private $sessionModel;

    public function __construct() {
        $this->sessionModel = new SessionModel();
    }

    public function validate() {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        $deviceFingerprint = $headers['X-Device-Fingerprint'] ?? $headers['x-device-fingerprint'] ?? $_SERVER['HTTP_X_DEVICE_FINGERPRINT'] ?? $_GET['device_fingerprint'] ?? $_GET['fingerprint'] ?? null;
        $clientIp = $this->getClientIp();
        
        if (!$token) {
            http_response_code(401);
            echo json_encode(['message' => 'No token provided', 'valid' => false]);
            return;
        }

        $payload = JWT::decode($token);
        
        if (!$payload) {
            http_response_code(401);
            echo json_encode(['message' => 'Invalid or expired token', 'valid' => false]);
            return;
        }

        $session = $this->sessionModel->validateToken($token, $clientIp, $deviceFingerprint);

        if ($session) {
            $userType = isset($payload['role']) ? $payload['role'] : ($session['user_type'] ?? 'admin');
            $user = $this->getUserData($payload['user_id'], $userType);

            http_response_code(200);
            echo json_encode([
                'valid' => true,
                'user_id' => $payload['user_id'],
                'user_type' => $userType,
                'user' => $user
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['message' => 'Invalid or expired session', 'valid' => false]);
        }
    }

    public function restore() {
        header('Content-Type: application/json');

        $rawInput = file_get_contents('php://input');
        $data = json_decode($rawInput, true);
        if (!$data) {
            $data = $_POST;
        }

        $headers = getallheaders();
        $userType = $data['user_type'] ?? $data['role'] ?? 'admin';
        $deviceFingerprint = $data['device_fingerprint'] ?? $data['fingerprint'] ?? $headers['X-Device-Fingerprint'] ?? $headers['x-device-fingerprint'] ?? $_SERVER['HTTP_X_DEVICE_FINGERPRINT'] ?? $_GET['device_fingerprint'] ?? null;
        $clientIp = $data['ip_address'] ?? $this->getClientIp();

        if (empty($deviceFingerprint)) {
            http_response_code(400);
            echo json_encode(['message' => 'Device fingerprint required', 'valid' => false]);
            return;
        }

        $session = $this->sessionModel->getActiveSessionByDevice($userType, $deviceFingerprint, $clientIp);

        if ($session) {
            $payload = JWT::decode($session['token']);
            if (!$payload) {
                http_response_code(401);
                echo json_encode(['message' => 'Session token is invalid or expired', 'valid' => false]);
                return;
            }

            $user = $this->getUserData($session['user_id'], $userType);

            http_response_code(200);
            echo json_encode([
                'valid' => true,
                'token' => $session['token'],
                'user_id' => $session['user_id'],
                'user_type' => $userType,
                'user' => $user
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'No active session found for this device', 'valid' => false]);
        }
    }

    public function logout() {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        $deviceFingerprint = $headers['X-Device-Fingerprint'] ?? $headers['x-device-fingerprint'] ?? $_SERVER['HTTP_X_DEVICE_FINGERPRINT'] ?? null;
        $userType = null;

        $rawInput = file_get_contents('php://input');
        if (!empty($rawInput)) {
            $data = json_decode($rawInput, true);
            if (!empty($data['device_fingerprint'])) {
                $deviceFingerprint = $data['device_fingerprint'];
            }
            if (!$token && !empty($data['token'])) {
                $token = $data['token'];
            }
            if (!empty($data['user_type']) || !empty($data['role'])) {
                $userType = $data['user_type'] ?? $data['role'];
            }
        }

        $this->sessionModel->deleteByTokenOrDevice($token, $deviceFingerprint, $userType);
        
        http_response_code(200);
        echo json_encode(['message' => 'Logout successful']);
    }

    public function logoutAll() {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token) {
            http_response_code(400);
            echo json_encode(['message' => 'No token provided']);
            return;
        }

        if (!JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Invalid token']);
            return;
        }

        $userId = JWT::getUserId($token);
        $payload = JWT::getPayload($token);
        $userType = isset($payload['role']) ? $payload['role'] : 'admin';
        
        $result = $this->sessionModel->deactivateAllUserSessions($userId, $userType);
        
        if ($result) {
            http_response_code(200);
            echo json_encode(['message' => 'All sessions logged out successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to logout all sessions']);
        }
    }

    private function getUserData($userId, $userType) {
        try {
            $user = null;
            if ($userType === 'admin') {
                require_once __DIR__ . '/../model/AdminModel.php';
                $model = new AdminModel();
                $user = $model->readOne($userId);
            } elseif ($userType === 'adviser') {
                require_once __DIR__ . '/../model/AdviserModel.php';
                $model = new AdviserModel();
                $user = $model->readOne($userId);
            } elseif ($userType === 'student') {
                require_once __DIR__ . '/../model/Students/StudentsModel.php';
                $model = new StudentsModel();
                $user = $model->readOne($userId);
            }

            if ($user) {
                unset($user['password']);
                if (isset($user['profile_photo']) && !empty($user['profile_photo'])) {
                    if (is_string($user['profile_photo']) && !str_starts_with($user['profile_photo'], 'data:')) {
                        $user['profile_photo'] = 'data:image/jpeg;base64,' . base64_encode($user['profile_photo']);
                    }
                }
            }
            return $user;
        } catch (Exception $e) {
            error_log("Error retrieving user data: " . $e->getMessage());
            return null;
        }
    }

    private function getClientIp() {
        $ip = '';
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            $ip = $_SERVER['HTTP_CLIENT_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
        } elseif (!empty($_SERVER['HTTP_X_REAL_IP'])) {
            $ip = $_SERVER['HTTP_X_REAL_IP'];
        } else {
            $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        }
        
        if (strpos($ip, ',') !== false) {
            $ips = explode(',', $ip);
            $ip = trim($ips[0]);
        }
        
        return $ip;
    }
}
