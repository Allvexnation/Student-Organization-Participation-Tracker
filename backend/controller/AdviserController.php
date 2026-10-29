<?php

require_once __DIR__ . '/../model/AdviserModel.php';
require_once __DIR__ . '/../model/AdviserOtpModel.php';
require_once __DIR__ . '/../model/SessionModel.php';
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../template/AdviserEmail.php';

class AdviserController {
    private $adviserModel;
    private $adviserOtpModel;
    private $sessionModel;

    public function __construct() {
        $this->adviserModel = new AdviserModel();
        $this->adviserOtpModel = new AdviserOtpModel();
        $this->sessionModel = new SessionModel();
    }

    private function getBearerToken() {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        if (!empty($headers)) {
            foreach ($headers as $key => $value) {
                if (strtolower($key) === 'authorization') {
                    $token = trim(str_ireplace('Bearer ', '', $value));
                    if (!empty($token) && $token !== 'null' && $token !== 'undefined') {
                        return $token;
                    }
                }
            }
        }
        
        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            $token = trim(str_ireplace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION']));
            if (!empty($token) && $token !== 'null' && $token !== 'undefined') {
                return $token;
            }
        }
        
        if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $token = trim(str_ireplace('Bearer ', '', $_SERVER['REDIRECT_HTTP_AUTHORIZATION']));
            if (!empty($token) && $token !== 'null' && $token !== 'undefined') {
                return $token;
            }
        }
        
        return null;
    }

    public function getAll() {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $advisers = $this->adviserModel->readAll();

        if ($advisers !== false) {
            http_response_code(200);
            echo json_encode(['advisers' => $advisers]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to fetch advisers']);
        }
    }

    public function getOne($id) {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $adviser = $this->adviserModel->readOne($id);

        if ($adviser) {
            http_response_code(200);
            echo json_encode(['adviser' => $adviser]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Adviser not found']);
        }
    }

    public function create() {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token || !JWT::validate($token)) {
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

        if (!isset($data['name']) || !isset($data['email'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $username = $this->adviserModel->generateUniqueUsername($data['name']);
        $password = $this->adviserModel->generateSecurePassword();

        $data['username'] = $username;
        $data['password'] = $password;

        $result = $this->adviserModel->create($data);

        if ($result) {
            $adviserEmail = new AdviserEmail();
            $emailSent = $adviserEmail->sendCredentials(
                $data['email'],
                $data['name'],
                $username,
                $password
            );

            $message = 'Adviser created successfully';
            if (!$emailSent) {
                $message .= ' (email notification failed)';
            }

            http_response_code(201);
            echo json_encode(['message' => $message, 'id' => $result, 'username' => $username]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to create adviser']);
        }
    }

    public function update($id) {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token || !JWT::validate($token)) {
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

        if (!isset($data['name']) || !isset($data['username']) || !isset($data['email'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $result = $this->adviserModel->update($id, $data);

        if ($result) {
            $adviser = $this->adviserModel->readOne($id);
            http_response_code(200);
            echo json_encode([
                'message' => 'Adviser updated successfully',
                'adviser' => $adviser
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update adviser']);
        }
    }

    public function delete($id) {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $reason = isset($data['reason']) ? $data['reason'] : 'No reason provided';

        $adviser = $this->adviserModel->readOne($id);
        $adminName = JWT::getPayload($token)['name'] ?? 'Admin';

        $result = $this->adviserModel->delete($id);

        if ($result) {
            if ($adviser && $adviser['email']) {
                $adviserEmail = new AdviserEmail();
                $adviserEmail->sendDeletionNotice($adviser['email'], $adviser['name'], $adminName, $reason);
            }

            http_response_code(200);
            echo json_encode(['message' => 'Adviser deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to delete adviser']);
        }
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

        $adviser = $this->adviserModel->verifyLogin($usernameOrEmail, $password);

        if ($adviser) {
            unset($adviser['password']);
            
            if (isset($adviser['profile_photo']) && !empty($adviser['profile_photo'])) {
                $adviser['profile_photo'] = 'data:image/jpeg;base64,' . base64_encode($adviser['profile_photo']);
            }
            
            $tokenPayload = [
                'user_id' => $adviser['id'],
                'email' => $adviser['email'],
                'role' => 'adviser'
            ];
            $token = JWT::encode($tokenPayload);
            
            $expiresAt = date('Y-m-d H:i:s', time() + (24 * 60 * 60));
            $sessionData = [
                'user_id' => $adviser['id'],
                'user_type' => 'adviser',
                'token' => $token,
                'expires_at' => $expiresAt,
                'is_active' => 1
            ];
            
            $this->sessionModel->create($sessionData);
            
            http_response_code(200);
            echo json_encode([
                'message' => 'Login successful',
                'token' => $token,
                'adviser' => $adviser
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['message' => 'Invalid credentials']);
        }
    }

    public function getProfile() {
        header('Content-Type: application/json');
        
        $token = $this->getBearerToken();
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $adviserId = JWT::getUserId($token);
        
        error_log("Fetching adviser profile for ID: " . $adviserId);

        $adviser = $this->adviserModel->readOne($adviserId);

        if ($adviser) {
            unset($adviser['password']);
            
            if (isset($adviser['profile_photo']) && !empty($adviser['profile_photo'])) {
                $adviser['profile_photo'] = 'data:image/jpeg;base64,' . base64_encode($adviser['profile_photo']);
            }
            
            http_response_code(200);
            echo json_encode(['adviser' => $adviser]);
        } else {
            error_log("Adviser not found for ID: " . $adviserId);
            http_response_code(404);
            echo json_encode(['message' => 'Adviser not found']);
        }
    }

    public function updateProfile() {
        header('Content-Type: application/json');
        
        $token = $this->getBearerToken();
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $adviserId = JWT::getUserId($token);

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
            'role' => isset($data['role']) ? $data['role'] : '',
            'status' => 'active'
        ];

        if (isset($data['password']) && !empty($data['password'])) {
            $updateData['password'] = $data['password'];
        }

        $result = $this->adviserModel->update($adviserId, $updateData);

        if ($result) {
            $adviser = $this->adviserModel->readOne($adviserId);
            unset($adviser['password']);
            
            if (isset($adviser['profile_photo']) && !empty($adviser['profile_photo'])) {
                $adviser['profile_photo'] = 'data:image/jpeg;base64,' . base64_encode($adviser['profile_photo']);
            }
            
            http_response_code(200);
            echo json_encode([
                'message' => 'Profile updated successfully',
                'adviser' => $adviser
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update profile']);
        }
    }

    public function forgotPassword() {
        header('Content-Type: application/json');
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['username_or_email'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Username or email is required']);
            return;
        }

        $usernameOrEmail = $data['username_or_email'];
        $adviser = $this->adviserModel->findByUsernameOrEmail($usernameOrEmail);

        if (!$adviser) {
            http_response_code(404);
            echo json_encode(['message' => 'Adviser not found']);
            return;
        }

        $this->adviserOtpModel->deleteByAdviserId($adviser['id']);
        
        $otpCode = sprintf('%06d', mt_rand(0, 999999));
        $otpCreated = $this->adviserOtpModel->create($adviser['id'], $otpCode, 10);

        if ($otpCreated) {
            $adviserEmail = new AdviserEmail();
            $emailSent = $adviserEmail->sendOtp($adviser['email'], $adviser['name'], $otpCode);

            if ($emailSent) {
                http_response_code(200);
                echo json_encode([
                    'message' => 'OTP sent successfully',
                    'adviser_id' => $adviser['id']
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['message' => 'Failed to send OTP email']);
            }
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to generate OTP']);
        }
    }

    public function verifyOtp() {
        header('Content-Type: application/json');
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['adviser_id']) || !isset($data['otp_code'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Adviser ID and OTP code are required']);
            return;
        }

        $adviserId = $data['adviser_id'];
        $otpCode = $data['otp_code'];

        $result = $this->adviserOtpModel->verifyOtp($adviserId, $otpCode, 3);

        if ($result['valid']) {
            http_response_code(200);
            echo json_encode(['message' => 'OTP verified successfully']);
        } else {
            http_response_code(400);
            echo json_encode(['message' => $result['message'], 'attempts' => $result['attempts'] ?? null]);
        }
    }

    public function resetPassword() {
        header('Content-Type: application/json');
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['adviser_id']) || !isset($data['new_password'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Adviser ID and new password are required']);
            return;
        }

        if (strlen($data['new_password']) < 6) {
            http_response_code(400);
            echo json_encode(['message' => 'Password must be at least 6 characters']);
            return;
        }

        $adviserId = $data['adviser_id'];
        $newPassword = $data['new_password'];

        $result = $this->adviserModel->resetPassword($adviserId, $newPassword);

        if ($result) {
            $this->adviserOtpModel->deleteByAdviserId($adviserId);
            http_response_code(200);
            echo json_encode(['message' => 'Password reset successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to reset password']);
        }
    }

    public function logout() {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $result = $this->sessionModel->deleteByToken($token);

        if ($result) {
            http_response_code(200);
            echo json_encode(['message' => 'Logout successful']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to logout']);
        }
    }

    public function verify() {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        http_response_code(200);
        echo json_encode(['message' => 'Token is valid']);
    }
}
