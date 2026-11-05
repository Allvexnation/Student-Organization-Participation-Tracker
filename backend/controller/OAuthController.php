<?php

require_once __DIR__ . '/../model/AdminModel.php';
require_once __DIR__ . '/../model/AdviserModel.php';
require_once __DIR__ . '/../model/Students/StudentsModel.php';
require_once __DIR__ . '/../model/SessionModel.php';
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../config/oauth.php';
require_once __DIR__ . '/../config/db.php';

class OAuthController {
    private $adminModel;
    private $adviserModel;
    private $studentModel;
    private $sessionModel;
    private $conn;

    public function __construct() {
        $this->adminModel = new AdminModel();
        $this->adviserModel = new AdviserModel();
        $this->studentModel = new StudentsModel();
        $this->sessionModel = new SessionModel();
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
    }

    public function googleLogin() {
        header('Content-Type: application/json');

        if (!OAuthConfig::isGoogleEnabled()) {
            http_response_code(503);
            echo json_encode(['message' => 'Google OAuth is not configured']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['id_token'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Google ID token is required']);
            return;
        }

        require_once __DIR__ . '/../model/web/BannedModel.php';
        $bannedModel = new BannedModel();
        $clientIp = $this->getClientIp();
        $reqIp = !empty($data['ip_address']) ? trim($data['ip_address']) : null;
        $ipCandidates = array_values(array_filter([$reqIp, $clientIp]));

        $sessionBan = $bannedModel->findActiveBan(null, null, $data['session_id'] ?? null, $ipCandidates);
        if ($sessionBan) {
            http_response_code(403);
            echo json_encode([
                'message' => 'Your session has been banned: ' . ($sessionBan['reason'] ?? 'Access restricted.'),
                'banned' => true,
                'ban_info' => $sessionBan
            ]);
            return;
        }

        $idToken = $data['id_token'];

        $googleUser = $this->verifyGoogleToken($idToken);

        if (!$googleUser) {
            http_response_code(401);
            echo json_encode(['message' => 'Invalid Google token']);
            return;
        }

        $admin = $this->adminModel->findByEmail($googleUser['email']);

        if (!$admin) {
            http_response_code(404);
            echo json_encode(['message' => 'No admin account found with this Google email']);
            return;
        }

        if (isset($admin['status']) && $admin['status'] === 'inactive') {
            http_response_code(403);
            echo json_encode(['message' => 'Your account has been deactivated. Please contact the administrator.']);
            return;
        }

        $activeBan = $bannedModel->findActiveBan('admin', $admin['id'], null, $ipCandidates);
        if ($activeBan) {
            http_response_code(403);
            echo json_encode([
                'message' => 'Your account has been banned: ' . ($activeBan['reason'] ?? 'Access restricted.'),
                'banned' => true,
                'ban_info' => $activeBan
            ]);
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
            'auth_type' => 'google'
        ];

        $this->sessionModel->create($sessionData);

        http_response_code(200);
        echo json_encode([
            'message' => 'Google login successful',
            'token' => $token,
            'admin' => $admin
        ]);
    }

    private function verifyGoogleToken($token) {
        $clientId = OAuthConfig::getGoogleClientId();

        $parts = explode('.', $token);
        if (count($parts) === 3) {

            $payload = $parts[1];
            $payload = str_replace(['-', '_'], ['+', '/'], $payload);
            $payload .= str_repeat('=', 3 - (strlen($payload) % 3));
            $decoded = base64_decode($payload);

            if ($decoded !== false) {
                $tokenInfo = json_decode($decoded, true);

                if ($tokenInfo && isset($tokenInfo['email'])) {

                    if (!isset($tokenInfo['aud']) || $tokenInfo['aud'] !== $clientId) {
                        error_log('Google token audience mismatch');
                        return null;
                    }

                    if (!isset($tokenInfo['iss']) || !in_array($tokenInfo['iss'], ['accounts.google.com', 'https://accounts.google.com'])) {
                        error_log('Google token issuer mismatch');
                        return null;
                    }

                    if (!isset($tokenInfo['email_verified']) || $tokenInfo['email_verified'] !== true) {
                        error_log('Google email not verified');
                        return null;
                    }

                    if (isset($tokenInfo['exp']) && $tokenInfo['exp'] < time()) {
                        error_log('Google token expired');
                        return null;
                    }

                    return [
                        'email' => $tokenInfo['email'] ?? null,
                        'name' => $tokenInfo['name'] ?? null,
                        'picture' => $tokenInfo['picture'] ?? null
                    ];
                }
            }
        }

        $tokenInfoUrl = OAuthConfig::getGoogleTokenInfoUrl();
        $url = $tokenInfoUrl . '?access_token=' . urlencode($token);
        $response = @file_get_contents($url);

        if ($response === false) {
            error_log('Failed to verify Google token');
            return null;
        }

        $tokenInfo = json_decode($response, true);

        if (!$tokenInfo || isset($tokenInfo['error'])) {
            error_log('Google token verification failed: ' . ($tokenInfo['error'] ?? 'Unknown error'));
            return null;
        }

        if (!isset($tokenInfo['aud']) || $tokenInfo['aud'] !== $clientId) {
            error_log('Google token audience mismatch');
            return null;
        }

        if (!isset($tokenInfo['email_verified']) || ($tokenInfo['email_verified'] !== true && $tokenInfo['email_verified'] !== 'true')) {
            error_log('Google email not verified');
            return null;
        }

        return [
            'email' => $tokenInfo['email'] ?? null,
            'name' => $tokenInfo['name'] ?? null,
            'picture' => $tokenInfo['picture'] ?? null
        ];
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

    public function getGoogleConfig() {
        header('Content-Type: application/json');

        $clientId = OAuthConfig::getGoogleClientId();

        if (empty($clientId)) {
            http_response_code(503);
            echo json_encode(['message' => 'Google OAuth is not configured']);
            return;
        }

        http_response_code(200);
        echo json_encode([
            'client_id' => $clientId,
            'enabled' => OAuthConfig::isGoogleEnabled(),
            'gsi_script_url' => OAuthConfig::getGoogleGsiScriptUrl()
        ]);
    }

    public function adviserGoogleLogin() {
        header('Content-Type: application/json');

        if (!OAuthConfig::isGoogleEnabled()) {
            http_response_code(503);
            echo json_encode(['message' => 'Google OAuth is not configured']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['id_token'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Google ID token is required']);
            return;
        }

        require_once __DIR__ . '/../model/web/BannedModel.php';
        $bannedModel = new BannedModel();
        $clientIp = $this->getClientIp();
        $reqIp = !empty($data['ip_address']) ? trim($data['ip_address']) : null;
        $ipCandidates = array_values(array_filter([$reqIp, $clientIp]));

        $sessionBan = $bannedModel->findActiveBan(null, null, $data['session_id'] ?? null, $ipCandidates);
        if ($sessionBan) {
            http_response_code(403);
            echo json_encode([
                'message' => 'Your session has been banned: ' . ($sessionBan['reason'] ?? 'Access restricted.'),
                'banned' => true,
                'ban_info' => $sessionBan
            ]);
            return;
        }

        $idToken = $data['id_token'];

        $googleUser = $this->verifyGoogleToken($idToken);

        if (!$googleUser) {
            http_response_code(401);
            echo json_encode(['message' => 'Invalid Google token']);
            return;
        }

        $adviser = $this->adviserModel->readByEmail($googleUser['email']);

        if (!$adviser) {
            http_response_code(404);
            echo json_encode(['message' => 'No adviser account found with this Google email']);
            return;
        }

        if (isset($adviser['status']) && $adviser['status'] === 'inactive') {
            http_response_code(403);
            echo json_encode(['message' => 'Your account has been deactivated. Please contact the administrator.']);
            return;
        }

        $activeBan = $bannedModel->findActiveBan('adviser', $adviser['id'], null, $ipCandidates);
        if ($activeBan) {
            http_response_code(403);
            echo json_encode([
                'message' => 'Your account has been banned: ' . ($activeBan['reason'] ?? 'Access restricted.'),
                'banned' => true,
                'ban_info' => $activeBan
            ]);
            return;
        }

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

        $expiresAt = '2038-01-19 03:14:07';

        $ipAddress = $data['ip_address'] ?? '';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';

        $sessionData = [
            'user_id' => $adviser['id'],
            'user_type' => 'adviser',
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
            'auth_type' => 'google'
        ];

        $this->sessionModel->create($sessionData);

        http_response_code(200);
        echo json_encode([
            'message' => 'Google login successful',
            'token' => $token,
            'adviser' => $adviser
        ]);
    }

    public function studentGoogleLogin() {
        header('Content-Type: application/json');

        if (!OAuthConfig::isGoogleEnabled()) {
            http_response_code(503);
            echo json_encode(['message' => 'Google OAuth is not configured']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['id_token'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Google ID token is required']);
            return;
        }

        require_once __DIR__ . '/../model/web/BannedModel.php';
        $bannedModel = new BannedModel();
        $clientIp = $this->getClientIp();
        $reqIp = !empty($data['ip_address']) ? trim($data['ip_address']) : null;
        $ipCandidates = array_values(array_filter([$reqIp, $clientIp]));

        $sessionBan = $bannedModel->findActiveBan(null, null, $data['session_id'] ?? null, $ipCandidates);
        if ($sessionBan) {
            http_response_code(403);
            echo json_encode([
                'message' => 'Your session has been banned: ' . ($sessionBan['reason'] ?? 'Access restricted.'),
                'banned' => true,
                'ban_info' => $sessionBan
            ]);
            return;
        }

        $idToken = $data['id_token'];

        $googleUser = $this->verifyGoogleToken($idToken);

        if (!$googleUser) {
            http_response_code(401);
            echo json_encode(['message' => 'Invalid Google token']);
            return;
        }

        $student = $this->studentModel->readByEmail($googleUser['email']);

        if (!$student) {
            http_response_code(404);
            echo json_encode(['message' => 'No student account found with this Google email']);
            return;
        }

        if (isset($student['status']) && $student['status'] === 'inactive') {
            http_response_code(403);
            echo json_encode(['message' => 'Your account has been deactivated. Please contact the administrator.']);
            return;
        }

        $activeBan = $bannedModel->findActiveBan('student', $student['id'], null, $ipCandidates);
        if ($activeBan) {
            http_response_code(403);
            echo json_encode([
                'message' => 'Your account has been banned: ' . ($activeBan['reason'] ?? 'Access restricted.'),
                'banned' => true,
                'ban_info' => $activeBan
            ]);
            return;
        }

        unset($student['password']);

        if (isset($student['profile_photo']) && !empty($student['profile_photo'])) {
            $student['profile_photo'] = 'data:image/jpeg;base64,' . base64_encode($student['profile_photo']);
        }

        $tokenPayload = [
            'user_id' => $student['id'],
            'email' => $student['email'],
            'role' => 'student'
        ];
        $token = JWT::encode($tokenPayload);

        $expiresAt = '2038-01-19 03:14:07';

        $ipAddress = $data['ip_address'] ?? '';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';

        $sessionData = [
            'user_id' => $student['id'],
            'user_type' => 'student',
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
            'auth_type' => 'google'
        ];

        $this->sessionModel->create($sessionData);

        http_response_code(200);
        echo json_encode([
            'message' => 'Google login successful',
            'token' => $token,
            'student' => $student
        ]);
    }
}
