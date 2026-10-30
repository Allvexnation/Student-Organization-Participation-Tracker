<?php

require_once __DIR__ . '/../model/AdminModel.php';
require_once __DIR__ . '/../model/SessionModel.php';
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../config/db.php';

class AdminController {
    private $adminModel;
    private $sessionModel;
    private $conn;

    public function __construct() {
        $this->adminModel = new AdminModel();
        $this->sessionModel = new SessionModel();
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
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
            
            $expiresAt = '2038-01-19 03:14:07'; 

            $ipAddress = $this->getClientIp();
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
            
            $sessionData = [
                'user_id' => $admin['id'],
                'user_type' => 'admin',
                'token' => $token,
                'expires_at' => $expiresAt,
                'is_active' => 1,
                'ip_address' => $data['ip_address'] ?? $ipAddress,
                'user_agent' => $data['user_agent'] ?? $userAgent,
                'device_type' => $data['device_type'] ?? 'unknown',
                'device_fingerprint' => $data['device_fingerprint'] ?? '',
                'screen_resolution' => $data['screen_resolution'] ?? '',
                'browser' => $data['browser'] ?? '',
                'os' => $data['os'] ?? '',
                'country' => $data['country'] ?? '',
                'city' => $data['city'] ?? '',
                'timezone' => $data['timezone'] ?? ''
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
}
