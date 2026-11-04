<?php

require_once __DIR__ . '/../model/AdminModel.php';
require_once __DIR__ . '/../model/AdminOtpModel.php';
require_once __DIR__ . '/../model/SessionModel.php';
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../cache/CacheService.php';
require_once __DIR__ . '/../validator/AdminCrudValidator.php';
require_once __DIR__ . '/../template/AdminEmail.php';

class AdminController {
    private $adminModel;
    private $adminOtpModel;
    private $sessionModel;
    private $conn;

    public function __construct() {
        $this->adminModel = new AdminModel();
        $this->adminOtpModel = new AdminOtpModel();
        $this->sessionModel = new SessionModel();
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
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

        $admins = CacheService::remember('admins_all', 300, function() {
            return $this->adminModel->readAll();
        });

        if ($admins !== false) {
            http_response_code(200);
            echo json_encode(['admins' => $admins]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to fetch admins']);
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

        $admin = CacheService::remember('admin_' . $id, 300, function() use ($id) {
            return $this->adminModel->readOne($id);
        });

        if ($admin) {
            http_response_code(200);
            echo json_encode(['admin' => $admin]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Admin not found']);
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

        $existingAdmins = $this->adminModel->readAll();
        $validation = AdminCrudValidator::validate($data, $existingAdmins, 'add');
        
        if (!$validation['isValid']) {
            http_response_code(400);
            echo json_encode(['message' => $validation['message']]);
            return;
        }

        $username = $this->adminModel->generateUniqueUsername($data['name']);
        $password = $this->adminModel->generateSecurePassword();

        $data['username'] = $username;
        $data['password'] = $password;

        $result = $this->adminModel->create($data);
        if ($result) {
            CacheService::forget('admins_all');
        }

        if ($result) {
            $adminEmail = new AdminEmail();
            $emailSent = $adminEmail->sendCredentials(
                $data['email'],
                $data['name'],
                $username,
                $password,
                $data['role']
            );

            $statusEmailSent = true;
            if (isset($data['status']) && $data['status'] === 'inactive') {
                $statusEmailSent = $adminEmail->sendStatusChange(
                    $data['email'],
                    $data['name'],
                    'inactive'
                );
            }

            $message = 'Admin created successfully';
            if (!$emailSent || !$statusEmailSent) {
                $message .= ' (some email notifications failed)';
            }

            http_response_code(201);
            echo json_encode(['message' => $message, 'id' => $result, 'username' => $username]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to create admin']);
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

        if (!isset($data['name']) || !isset($data['email'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $existingAdmins = $this->adminModel->readAll();
        $validation = AdminCrudValidator::validate($data, $existingAdmins, 'edit', $id);

        if (!$validation['isValid']) {
            http_response_code(400);
            echo json_encode(['message' => $validation['message']]);
            return;
        }

        if (isset($data['username']) && !empty($data['username'])) {
            $existingAdmin = $this->adminModel->readByUsername($data['username']);
            if ($existingAdmin && $existingAdmin['id'] != $id) {
                http_response_code(400);
                echo json_encode(['message' => 'Username already exists']);
                return;
            }
        }

        $oldAdmin = $this->adminModel->readOne($id);

        $result = $this->adminModel->update($id, $data);
        if ($result) {
            CacheService::forget('admins_all');
            CacheService::forget('admin_' . $id);
        }

        if ($result) {
            $adminEmail = new AdminEmail();
            $emailNotifications = [];

            $roleChanged = $oldAdmin && isset($data['role']) && $oldAdmin['role'] !== $data['role'];
            $statusChanged = $oldAdmin && isset($data['status']) && $oldAdmin['status'] !== $data['status'];

            if ($statusChanged) {
                if ($data['status'] === 'inactive') {
                    $this->sessionModel->moveToInactive($id, 'admin');
                } elseif ($data['status'] === 'active') {
                    $this->sessionModel->restoreFromInactive($id, 'admin');
                }
            }

            if ($roleChanged && $statusChanged) {
                $combinedEmailSent = $adminEmail->sendRoleAndStatusChange(
                    $data['email'],
                    $data['name'],
                    $data['role'],
                    $data['status']
                );
                $emailNotifications[] = $combinedEmailSent ? 'role and status' : 'role and status (failed)';
            } else {

                if ($roleChanged) {
                    $roleEmailSent = $adminEmail->sendRoleAssignment(
                        $data['email'],
                        $data['name'],
                        $data['role']
                    );
                    $emailNotifications[] = $roleEmailSent ? 'role' : 'role (failed)';
                }

                if ($statusChanged) {
                    $statusEmailSent = $adminEmail->sendStatusChange(
                        $data['email'],
                        $data['name'],
                        $data['status']
                    );
                    $emailNotifications[] = $statusEmailSent ? 'status' : 'status (failed)';
                }
            }

            $admin = CacheService::remember('admin_' . $id, 300, function() use ($id) {
            return $this->adminModel->readOne($id);
            });

            $message = 'Admin updated successfully';
            if (!empty($emailNotifications)) {
                $failedNotifications = array_filter($emailNotifications, function($n) { return strpos($n, 'failed') !== false; });
                if (!empty($failedNotifications)) {
                    $message .= ' (some email notifications failed)';
                }
            }

            http_response_code(200);
            echo json_encode([
                'message' => $message,
                'admin' => $admin
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update admin']);
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

        $existingAdmins = $this->adminModel->readAll();
        $deleteValidation = AdminCrudValidator::canDelete($id, $existingAdmins);

        if (!$deleteValidation['canDelete']) {
            http_response_code(403);
            echo json_encode(['message' => $deleteValidation['message']]);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $reason = isset($data['reason']) ? $data['reason'] : 'No reason provided';

        $admin = $this->adminModel->readOne($id);
        $adminName = '';
        if ($token && JWT::validate($token)) {
            $adminId = JWT::getUserId($token);
            $currentAdmin = $this->adminModel->readOne($adminId);
            $adminName = $currentAdmin ? $currentAdmin['name'] : 'Admin';
        }

        $result = $this->adminModel->delete($id);
        if ($result) {
            CacheService::forget('admins_all');
            CacheService::forget('admin_' . $id);
        }

        if ($result) {
            if ($admin && $admin['email']) {
                $adminEmail = new AdminEmail();
                $adminEmail->sendDeletionNotice($admin['email'], $admin['name'], $adminName, $reason);
            }

            http_response_code(200);
            echo json_encode(['message' => 'Admin deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to delete admin']);
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

        $admin = $this->adminModel->verifyLogin($usernameOrEmail, $password);

        if ($admin) {
            if (isset($admin['status']) && $admin['status'] === 'inactive') {
                http_response_code(403);
                echo json_encode(['message' => 'Your account has been deactivated. Please contact the administrator.']);
                return;
            }

            unset($admin['password']);

            if (isset($admin['profile_photo']) && !empty($admin['profile_photo'])) {
                $admin['profile_photo'] = 'data:image/jpeg;base64,' . base64_encode($admin['profile_photo']);
            }

            $crtAdminEmail = getenv('CRT_ADMIN_EMAIL');
            $isCrtAdmin = strtolower($admin['email']) === strtolower($crtAdminEmail);

            $tokenPayload = [
                'user_id' => $admin['id'],
                'email' => $admin['email'],
                'role' => 'admin',
                'is_crt_admin' => $isCrtAdmin
            ];
            $token = JWT::encode($tokenPayload);

            $expiresAt = '2038-01-19 03:14:07';

            $ipAddress = $data['ip_address'] ?? '';
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';

            $sessionData = [
                'user_id' => $admin['id'],
                'user_type' => 'admin',
                'token' => $token,
                'expires_at' => $expiresAt,
                'is_active' => 1,
                'ip_address' => $ipAddress,
                'user_agent' => $data['user_agent'] ?? $userAgent,
                'device_type' => $data['device_type'] ?? 'unknown',
                'device_fingerprint' => $data['device_fingerprint'] ?? '',
                'screen_resolution' => $data['screen_resolution'] ?? '',
                'browser' => $data['browser'] ?? '',
                'os' => $data['os'] ?? '',
                'country' => $data['country'] ?? '',
                'city' => $data['city'] ?? '',
                'timezone' => $data['timezone'] ?? '',
                'auth_type' => 'password'
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

    public function lookupAccount() {
        header('Content-Type: application/json');

        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['username_or_email']) || trim($data['username_or_email']) === '') {
            http_response_code(400);
            echo json_encode(['message' => 'Username or email is required']);
            return;
        }

        $admin = $this->adminModel->findByUsernameOrEmail(trim($data['username_or_email']));

        if (!$admin) {
            http_response_code(404);
            echo json_encode(['message' => 'Account not found']);
            return;
        }

        if (isset($admin['status']) && $admin['status'] === 'inactive') {
            http_response_code(403);
            echo json_encode(['message' => 'Your account has been deactivated. Please contact the administrator.']);
            return;
        }

        $profilePhoto = null;
        if (isset($admin['profile_photo']) && !empty($admin['profile_photo'])) {
            if (is_string($admin['profile_photo']) && !str_starts_with($admin['profile_photo'], 'data:')) {
                $profilePhoto = 'data:image/jpeg;base64,' . base64_encode($admin['profile_photo']);
            } else {
                $profilePhoto = $admin['profile_photo'];
            }
        }

        http_response_code(200);
        echo json_encode([
            'exists' => true,
            'name' => $admin['name'] ?? $admin['username'] ?? '',
            'username' => $admin['username'] ?? '',
            'profile_photo' => $profilePhoto
        ]);
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

        if (!$admin) {
            http_response_code(404);
            echo json_encode(['message' => 'Admin not found']);
            return;
        }

        unset($admin['password']);

        if (isset($admin['profile_photo']) && !empty($admin['profile_photo'])) {
            $admin['profile_photo'] = 'data:image/jpeg;base64,' . base64_encode($admin['profile_photo']);
        }

        $crtAdminEmail = getenv('CRT_ADMIN_EMAIL');
        $admin['is_crt_admin'] = strtolower($admin['email']) === strtolower($crtAdminEmail);

        http_response_code(200);
        echo json_encode(['admin' => $admin]);
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

        $admin = $this->adminModel->readOne($adminId);
        $crtAdminEmail = getenv('CRT_ADMIN_EMAIL');

        if (strtolower($admin['email']) === strtolower($crtAdminEmail) && isset($data['password']) && !empty($data['password'])) {
            http_response_code(403);
            echo json_encode(['message' => 'Cannot change password for CRT admin account']);
            return;
        }

        $profilePhoto = null;
        if (isset($data['profile_photo'])) {
            if (!empty($data['profile_photo'])) {
                if (strpos($data['profile_photo'], 'data:image') === 0) {
                    $parts = explode(',', $data['profile_photo']);
                    if (isset($parts[1])) {
                        $profilePhoto = base64_decode($parts[1]);
                    }
                } else {
                    $profilePhoto = base64_decode($data['profile_photo']);
                }
            } else {
                $profilePhoto = '';
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

            $admin['is_crt_admin'] = strtolower($admin['email']) === strtolower($crtAdminEmail);

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

    public function logout() {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        $deviceFingerprint = $headers['X-Device-Fingerprint'] ?? $headers['x-device-fingerprint'] ?? $_SERVER['HTTP_X_DEVICE_FINGERPRINT'] ?? null;
        
        $rawInput = file_get_contents('php://input');
        if (!empty($rawInput)) {
            $data = json_decode($rawInput, true);
            if (!empty($data['device_fingerprint'])) {
                $deviceFingerprint = $data['device_fingerprint'];
            }
            if (!$token && !empty($data['token'])) {
                $token = $data['token'];
            }
        }

        $this->sessionModel->deleteByTokenOrDevice($token, $deviceFingerprint, 'admin');
        
        http_response_code(200);
        echo json_encode(['message' => 'Logout successful']);
    }

    public function getDashboardCounts() {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        if (!$this->conn) {
            error_log("Database connection is null in getDashboardCounts");
            http_response_code(500);
            echo json_encode(['message' => 'Database connection failed']);
            return;
        }

        try {
            $studentCount = 0;
            $organizationCount = 0;
            $activeEventCount = 0;
            $eventRegistrationCount = 0;
            $orgMembershipCount = 0;

            $stmt = $this->conn->query("SELECT COUNT(*) as count FROM students");
            if ($stmt) {
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                $studentCount = $result['count'] ?? 0;
            }

            $stmt = $this->conn->query("SELECT COUNT(*) as count FROM organizations");
            if ($stmt) {
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                $organizationCount = $result['count'] ?? 0;
            }

            $stmt = $this->conn->query("SELECT COUNT(*) as count FROM events");
            if ($stmt) {
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                $activeEventCount = $result['count'] ?? 0;
            }

            try {
                $stmt = $this->conn->query("SELECT COUNT(*) as count FROM event_organizations");
                if ($stmt) {
                    $result = $stmt->fetch(PDO::FETCH_ASSOC);
                    $eventRegistrationCount = $result['count'] ?? 0;
                }
            } catch (PDOException $e) {
                error_log("Event organizations table error: " . $e->getMessage());
                $eventRegistrationCount = 0;
            }

            try {
                $stmt = $this->conn->query("SELECT COUNT(*) as count FROM organization_memberships");
                if ($stmt) {
                    $result = $stmt->fetch(PDO::FETCH_ASSOC);
                    $orgMembershipCount = $result['count'] ?? 0;
                }
            } catch (PDOException $e) {
                error_log("Organization memberships table error: " . $e->getMessage());
                $orgMembershipCount = 0;
            }
            
            http_response_code(200);
            echo json_encode([
                'totalStudents' => (int)$studentCount,
                'totalOrganizations' => (int)$organizationCount,
                'activeEvents' => (int)$activeEventCount,
                'eventRegistrations' => (int)$eventRegistrationCount,
                'orgMemberships' => (int)$orgMembershipCount
            ]);
        } catch (PDOException $e) {
            error_log("Dashboard counts error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['message' => 'Error fetching dashboard counts']);
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
        $crtAdminEmail = getenv('CRT_ADMIN_EMAIL');

        if (strtolower($usernameOrEmail) === strtolower($crtAdminEmail)) {
            http_response_code(403);
            echo json_encode(['message' => 'Password reset is not allowed for this account']);
            return;
        }

        $admin = $this->adminModel->findByUsernameOrEmail($usernameOrEmail);

        if (!$admin) {
            http_response_code(404);
            echo json_encode(['message' => 'Admin not found']);
            return;
        }

        if (strtolower($admin['email']) === strtolower($crtAdminEmail)) {
            http_response_code(403);
            echo json_encode(['message' => 'Password reset is not allowed for this account']);
            return;
        }

        if (isset($admin['status']) && $admin['status'] === 'inactive') {
            http_response_code(403);
            echo json_encode(['message' => 'Your account has been deactivated. Please contact the administrator.']);
            return;
        }

        $this->adminOtpModel->deleteByAdminId($admin['id']);
        
        $otpCode = sprintf('%06d', mt_rand(0, 999999));
        $otpCreated = $this->adminOtpModel->create($admin['id'], $otpCode, 10);

        if ($otpCreated) {
            $adminEmail = new AdminEmail();
            $emailSent = $adminEmail->sendOtp($admin['email'], $admin['name'], $otpCode);

            if ($emailSent) {
                http_response_code(200);
                echo json_encode([
                    'message' => 'OTP sent successfully',
                    'admin_id' => $admin['id']
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
        
        if (!isset($data['admin_id']) || !isset($data['otp_code'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Admin ID and OTP code are required']);
            return;
        }

        $adminId = $data['admin_id'];
        $otpCode = $data['otp_code'];

        $result = $this->adminOtpModel->verifyOtp($adminId, $otpCode, 3);

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
        
        if (!isset($data['admin_id']) || !isset($data['new_password'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Admin ID and new password are required']);
            return;
        }

        if (strlen($data['new_password']) < 6) {
            http_response_code(400);
            echo json_encode(['message' => 'Password must be at least 6 characters']);
            return;
        }

        $adminId = $data['admin_id'];
        $newPassword = $data['new_password'];

        $result = $this->adminModel->resetPassword($adminId, $newPassword);

        if ($result) {
            try {
                $this->adminOtpModel->deleteByAdminId($adminId);
            } catch (Exception $e) {
                error_log("Failed to delete OTP: " . $e->getMessage());
            }
            http_response_code(200);
            echo json_encode(['message' => 'Password reset successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to reset password']);
        }
    }
}
