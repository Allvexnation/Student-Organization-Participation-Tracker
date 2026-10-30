<?php

require_once __DIR__ . '/../model/AdviserModel.php';
require_once __DIR__ . '/../model/AdviserOtpModel.php';
require_once __DIR__ . '/../model/SessionModel.php';
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../template/AdviserEmail.php';
require_once __DIR__ . '/../cache/CacheService.php';

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

        $advisers = CacheService::remember('advisers_all', 300, function() {
            return $this->adviserModel->readAll();
        });

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

        $adviser = CacheService::remember('adviser_' . $id, 300, function() use ($id) {
            return $this->adviserModel->readOne($id);
        });

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
            CacheService::forget('advisers_all');
        }

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

        if (!isset($data['name']) || !isset($data['email'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        if (isset($data['username']) && !empty($data['username'])) {
            $existingAdviser = $this->adviserModel->readByUsername($data['username']);
            if ($existingAdviser && $existingAdviser['id'] != $id) {
                http_response_code(400);
                echo json_encode(['message' => 'Username already exists']);
                return;
            }
        }

        $result = $this->adviserModel->update($id, $data);
        if ($result) {
            CacheService::forget('advisers_all');
            CacheService::forget('adviser_' . $id);
        }

        if ($result) {
            $adviser = CacheService::remember('adviser_' . $id, 300, function() use ($id) {
            return $this->adviserModel->readOne($id);
        });
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

        $adviser = CacheService::remember('adviser_' . $id, 300, function() use ($id) {
            return $this->adviserModel->readOne($id);
        });
        $adminName = JWT::getPayload($token)['name'] ?? 'Admin';

        $result = $this->adviserModel->delete($id);
        if ($result) {
            CacheService::forget('advisers_all');
            CacheService::forget('adviser_' . $id);
        }

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
                if (is_string($adviser['profile_photo']) && !str_starts_with($adviser['profile_photo'], 'data:')) {
                    $adviser['profile_photo'] = 'data:image/jpeg;base64,' . base64_encode($adviser['profile_photo']);
                }
            }
            
            $tokenPayload = [
                'user_id' => $adviser['id'],
                'email' => $adviser['email'],
                'role' => 'adviser'
            ];
            $token = JWT::encode($tokenPayload);
            
            $expiresAt = '2038-01-19 03:14:07';

            $ipAddress = $this->getClientIp();
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
            
            $sessionData = [
                'user_id' => $adviser['id'],
                'user_type' => 'adviser',
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
                'adviser' => $adviser
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
                if (is_string($adviser['profile_photo']) && !str_starts_with($adviser['profile_photo'], 'data:')) {
                    $adviser['profile_photo'] = 'data:image/jpeg;base64,' . base64_encode($adviser['profile_photo']);
                }
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

        $existingAdviser = $this->adviserModel->readOne($adviserId);
        if (!$existingAdviser) {
            http_response_code(404);
            echo json_encode(['message' => 'Adviser not found']);
            return;
        }

        $profilePhoto = null;
        if (isset($data['profile_photo'])) {
            if (!empty($data['profile_photo'])) {
                $profilePhoto = $data['profile_photo'];
            } else {

                $profilePhoto = '';
            }
        } elseif ($existingAdviser && isset($existingAdviser['profile_photo']) && !empty($existingAdviser['profile_photo'])) {
            $profilePhoto = $existingAdviser['profile_photo'];
        }

        $updateData = [
            'profile_photo' => $profilePhoto,
            'name' => isset($data['name']) ? $data['name'] : ($existingAdviser['name'] ?? ''),
            'username' => isset($data['username']) ? $data['username'] : ($existingAdviser['username'] ?? ''),
            'email' => isset($data['email']) ? $data['email'] : ($existingAdviser['email'] ?? ''),
            'role' => isset($data['role']) ? $data['role'] : ($existingAdviser['role'] ?? 'Adviser'),
            'status' => 'active'
        ];

        if (isset($data['password']) && !empty($data['password'])) {
            $updateData['password'] = $data['password'];
        }

        $result = $this->adviserModel->update($adviserId, $updateData);

        if ($result) {
            CacheService::forget('advisers_all');
            CacheService::forget('adviser_' . $adviserId);

            $adviser = $this->adviserModel->readOne($adviserId);
            unset($adviser['password']);
            
            if (isset($adviser['profile_photo']) && !empty($adviser['profile_photo'])) {
                if (is_string($adviser['profile_photo']) && !str_starts_with($adviser['profile_photo'], 'data:')) {
                    $adviser['profile_photo'] = 'data:image/jpeg;base64,' . base64_encode($adviser['profile_photo']);
                }
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
            try {
                $this->adviserOtpModel->deleteByAdviserId($adviserId);
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

        $this->sessionModel->deleteByTokenOrDevice($token, $deviceFingerprint, 'adviser');
        
        http_response_code(200);
        echo json_encode(['message' => 'Logout successful']);
        return;
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

    public function getDashboardCounts() {
        header('Content-Type: application/json');
        
        $token = $this->getBearerToken();
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $adviserId = JWT::getUserId($token);

        try {
            require_once __DIR__ . '/../config/db.php';
            require_once __DIR__ . '/../model/OrganizationsModel.php';
            require_once __DIR__ . '/../model/EventsModel.php';
            require_once __DIR__ . '/../model/Students/StudentsModel.php';
            require_once __DIR__ . '/../model/OrganizationMembershipsModel.php';
            require_once __DIR__ . '/../model/EventRegistrationsModel.php';

            $database = Database::getInstance();
            $conn = $database->getConnection();

            $organizationModel = new OrganizationsModel();
            $eventModel = new EventsModel();
            $studentModel = new StudentsModel();
            $orgMembershipModel = new OrganizationMembershipsModel();
            $eventRegistrationModel = new EventRegistrationsModel();

            $organizations = $organizationModel->getByAdviserId($adviserId);
            $totalOrganizations = is_array($organizations) ? count($organizations) : 0;

            $activeEvents = 0;
            $eventRegistrations = 0;
            $totalStudents = 0;

            if ($totalOrganizations > 0 && is_array($organizations)) {
                $orgIds = array_column($organizations, 'id');
                $orgIdsString = implode(',', array_fill(0, count($orgIds), '?'));

                foreach ($orgIds as $orgId) {
                    $orgEvents = $eventModel->getByOrganizationId($orgId);
                    if (is_array($orgEvents)) {
                        $activeEvents += count($orgEvents);
                    }

                    $members = $orgMembershipModel->readByOrganizationId($orgId);
                    if (is_array($members)) {
                        $totalStudents += count($members);
                    }
                }

                $query = "SELECT COUNT(*) as total FROM event_organizations eo
                          WHERE eo.organization_id IN ($orgIdsString)";
                try {
                    $stmt = $conn->prepare($query);
                    $stmt->execute($orgIds);
                    $result = $stmt->fetch(PDO::FETCH_ASSOC);
                    $eventRegistrations = $result['total'] ?? 0;
                } catch(PDOException $e) {
                    error_log("Error counting event organizations: " . $e->getMessage());
                    $eventRegistrations = 0;
                }
            }

            $orgMemberships = $totalStudents;
            $pendingRequests = 0;

            http_response_code(200);
            echo json_encode([
                'totalStudents' => $totalStudents,
                'totalOrganizations' => $totalOrganizations,
                'activeEvents' => $activeEvents,
                'eventRegistrations' => $eventRegistrations,
                'orgMemberships' => $orgMemberships,
                'pendingRequests' => $pendingRequests
            ]);
        } catch (Exception $e) {
            error_log('Error fetching dashboard counts: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['message' => 'Failed to fetch dashboard counts']);
        }
    }
}
