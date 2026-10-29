<?php

require_once __DIR__ . '/../model/AdminModel.php';
require_once __DIR__ . '/../model/SessionModel.php';
require_once __DIR__ . '/../config/jwt.php';

class AdminController {
    private $adminModel;
    private $sessionModel;

    public function __construct() {
        $this->adminModel = new AdminModel();
        $this->sessionModel = new SessionModel();
    }

    public function login() {
        header('Content-Type: application/json');
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['username_or_email']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Username/email and password are required']);
            return;
        }

        $usernameOrEmail = $data['username_or_email'];
        $password = $data['password'];

        $admin = $this->adminModel->verifyLogin($usernameOrEmail, $password);

        if ($admin) {
            unset($admin['password']);
            
            if (isset($admin['profile_photo']) && !empty($admin['profile_photo'])) {
                $admin['profile_photo'] = 'data:image/jpeg;base64,' . base64_encode($admin['profile_photo']);
            }
            
            $tokenPayload = [
                'user_id' => $admin['id'],
                'email' => $admin['email'],
                'role' => 'admin'
            ];
            $token = JWT::encode($tokenPayload);
            
            $expiresAt = date('Y-m-d H:i:s', time() + (24 * 60 * 60));
            $sessionData = [
                'user_id' => $admin['id'],
                'user_type' => 'admin',
                'token' => $token,
                'expires_at' => $expiresAt,
                'is_active' => 1
            ];
            
            $this->sessionModel->create($sessionData);
            
            http_response_code(200);
            echo json_encode([
                'message' => 'Login successful',
                'token' => $token,
                'admin' => $admin
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['message' => 'Invalid credentials']);
        }
    }

    public function getProfile() {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $adminId = JWT::getUserId($token);

        $admin = $this->adminModel->readOne($adminId);

        if ($admin) {
            unset($admin['password']);
            
            if (isset($admin['profile_photo']) && !empty($admin['profile_photo'])) {
                $admin['profile_photo'] = 'data:image/jpeg;base64,' . base64_encode($admin['profile_photo']);
            }
            
            http_response_code(200);
            echo json_encode(['admin' => $admin]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Admin not found']);
        }
    }

    public function updateProfile() {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $adminId = JWT::getUserId($token);

        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid data']);
            return;
        }

        $profilePhoto = null;
        if (isset($data['profile_photo']) && !empty($data['profile_photo'])) {
            if (strpos($data['profile_photo'], 'data:image') === 0) {
                $parts = explode(',', $data['profile_photo']);
                if (isset($parts[1])) {
                    $profilePhoto = base64_decode($parts[1]);
                }
            } else {
                $profilePhoto = base64_decode($data['profile_photo']);
            }
        }

        $updateData = [
            'profile_photo' => $profilePhoto,
            'name' => isset($data['name']) ? $data['name'] : '',
            'username' => isset($data['username']) ? $data['username'] : '',
            'email' => isset($data['email']) ? $data['email'] : '',
            'role' => isset($data['role']) ? $data['role'] : ''
        ];

        if (isset($data['password']) && !empty($data['password'])) {
            $updateData['password'] = $data['password'];
        }

        $result = $this->adminModel->update($adminId, $updateData);

        if ($result) {
            $admin = $this->adminModel->readOne($adminId);
            unset($admin['password']);
            
            if (isset($admin['profile_photo']) && !empty($admin['profile_photo'])) {
                $admin['profile_photo'] = 'data:image/jpeg;base64,' . base64_encode($admin['profile_photo']);
            }
            
            http_response_code(200);
            echo json_encode([
                'message' => 'Profile updated successfully',
                'admin' => $admin
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update profile']);
        }
    }
}
