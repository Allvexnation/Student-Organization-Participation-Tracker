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
        
        if (!$token) {
            http_response_code(401);
            echo json_encode(['message' => 'No token provided']);
            return;
        }

        $payload = JWT::decode($token);
        
        if (!$payload) {
            http_response_code(401);
            echo json_encode(['message' => 'Invalid or expired token']);
            return;
        }

        $session = $this->sessionModel->validateToken($token);

        if ($session) {
            http_response_code(200);
            echo json_encode([
                'valid' => true,
                'user_id' => $payload['user_id'],
                'user_type' => isset($payload['role']) ? $payload['role'] : 'admin'
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['message' => 'Invalid or expired session']);
        }
    }

    public function logout() {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token) {
            http_response_code(400);
            echo json_encode(['message' => 'No token provided']);
            return;
        }

        $result = $this->sessionModel->deactivateToken($token);
        
        if ($result) {
            http_response_code(200);
            echo json_encode(['message' => 'Logout successful']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to logout']);
        }
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
}
