<?php

require_once __DIR__ . '/../config/db.php';

class SessionModel {
    private $conn;
    private $table_name = "sessions";

    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
    }

    public function create($data) {

        if (!empty($data['user_id']) && !empty($data['user_type'])) {
            $this->deactivateExistingUserDeviceSessions(
                $data['user_id'],
                $data['user_type'],
                $data['device_fingerprint'] ?? null
            );
        }
        $query = "INSERT INTO " . $this->table_name . " 
                  (user_id, user_type, token, expires_at, is_active, ip_address, user_agent, device_type, device_fingerprint, screen_resolution, browser, os, country, city, timezone) 
                  VALUES (:user_id, :user_type, :token, :expires_at, :is_active, :ip_address, :user_agent, :device_type, :device_fingerprint, :screen_resolution, :browser, :os, :country, :city, :timezone)";

        try {
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':user_id', $data['user_id']);
            $stmt->bindParam(':user_type', $data['user_type']);
            $stmt->bindParam(':token', $data['token']);
            $stmt->bindParam(':expires_at', $data['expires_at']);
            $stmt->bindParam(':is_active', $data['is_active']);
            $stmt->bindParam(':ip_address', $data['ip_address']);
            $stmt->bindParam(':user_agent', $data['user_agent']);
            $stmt->bindParam(':device_type', $data['device_type']);
            $stmt->bindParam(':device_fingerprint', $data['device_fingerprint']);
            $stmt->bindParam(':screen_resolution', $data['screen_resolution']);
            $stmt->bindParam(':browser', $data['browser']);
            $stmt->bindParam(':os', $data['os']);
            $stmt->bindParam(':country', $data['country']);
            $stmt->bindParam(':city', $data['city']);
            $stmt->bindParam(':timezone', $data['timezone']);
            
            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error creating session: " . $e->getMessage());
            return false;
        }
    }

    public function validateToken($token, $currentIp = null, $currentFingerprint = null) {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE token = :token 
                  AND is_active = 1 
                  AND (expires_at > NOW() OR expires_at >= '2038-01-01 00:00:00' OR expires_at IS NULL) 
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':token', $token);
            $stmt->execute();
            $session = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$session) {
                return false;
            }

            if ($currentFingerprint && !empty($session['device_fingerprint'])) {
                if ($currentFingerprint !== $session['device_fingerprint']) {
                    error_log("Session validation failed: Device fingerprint mismatch");
                    return false;
                }
            }

            if ($currentIp && !empty($session['ip_address'])) {
                if ($currentIp !== $session['ip_address']) {
                    error_log("IP address changed for session ID " . $session['id'] . 
                              ". Previous: " . $session['ip_address'] . 
                              ", Current: " . $currentIp . 
                              ". Device fingerprint matched, allowing session.");

                    $this->updateSessionIp($session['id'], $currentIp);
                }
            }
            
            return $session;
        } catch(PDOException $e) {
            error_log("Error validating token: " . $e->getMessage());
            return false;
        }
    }

    public function getActiveSessionByDevice($userType, $deviceFingerprint, $currentIp = null) {
        if (empty($deviceFingerprint)) {
            return false;
        }

        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE user_type = :user_type 
                  AND device_fingerprint = :device_fingerprint 
                  AND is_active = 1 
                  AND (expires_at > NOW() OR expires_at >= '2038-01-01 00:00:00' OR expires_at IS NULL) 
                  ORDER BY id DESC 
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':user_type', $userType);
            $stmt->bindParam(':device_fingerprint', $deviceFingerprint);
            $stmt->execute();
            $session = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$session) {
                return false;
            }

            if (!JWT::validate($session['token'])) {
                $this->deactivateToken($session['token']);
                return false;
            }

            if ($currentIp && !empty($session['ip_address']) && $currentIp !== $session['ip_address']) {
                $this->updateSessionIp($session['id'], $currentIp);
            }

            return $session;
        } catch(PDOException $e) {
            error_log("Error restoring session by device: " . $e->getMessage());
            return false;
        }
    }

    private function updateSessionIp($sessionId, $newIp) {
        $query = "UPDATE " . $this->table_name . " 
                  SET ip_address = :ip_address 
                  WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':ip_address', $newIp);
            $stmt->bindParam(':id', $sessionId);
            $stmt->execute();
        } catch(PDOException $e) {
            error_log("Error updating session IP: " . $e->getMessage());
        }
    }

    public function deactivateToken($token) {
        $query = "UPDATE " . $this->table_name . " 
                  SET is_active = 0 
                  WHERE token = :token";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':token', $token);
            
            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error deactivating token: " . $e->getMessage());
            return false;
        }
    }

    public function deleteByToken($token) {
        $query = "DELETE FROM " . $this->table_name . " 
                  WHERE token = :token";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':token', $token);
            
            if($stmt->execute()) {
                return $stmt->rowCount() > 0;
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error deleting token: " . $e->getMessage());
            return false;
        }
    }

    public function deactivateExistingUserDeviceSessions($userId, $userType, $deviceFingerprint = null) {
        try {
            if (!empty($deviceFingerprint)) {
                $query = "DELETE FROM " . $this->table_name . " 
                          WHERE user_id = :user_id 
                          AND user_type = :user_type 
                          AND device_fingerprint = :device_fingerprint";
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':user_id', $userId);
                $stmt->bindParam(':user_type', $userType);
                $stmt->bindParam(':device_fingerprint', $deviceFingerprint);
                $stmt->execute();
            } else {
                $query = "DELETE FROM " . $this->table_name . " 
                          WHERE user_id = :user_id 
                          AND user_type = :user_type";
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':user_id', $userId);
                $stmt->bindParam(':user_type', $userType);
                $stmt->execute();
            }
            return true;
        } catch(PDOException $e) {
            error_log("Error removing existing duplicate sessions: " . $e->getMessage());
            return false;
        }
    }

    public function deleteByTokenOrDevice($token = null, $deviceFingerprint = null, $userType = null) {
        $deleted = false;
        try {
            if (!empty($token)) {
                $query = "DELETE FROM " . $this->table_name . " WHERE token = :token";
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':token', $token);
                $stmt->execute();
                if ($stmt->rowCount() > 0) {
                    $deleted = true;
                }
            }

            if (!empty($deviceFingerprint)) {
                $query = "DELETE FROM " . $this->table_name . " WHERE device_fingerprint = :device_fingerprint";
                if (!empty($userType)) {
                    $query .= " AND user_type = :user_type";
                }
                $stmt = $this->conn->prepare($query);
                $stmt->bindParam(':device_fingerprint', $deviceFingerprint);
                if (!empty($userType)) {
                    $stmt->bindParam(':user_type', $userType);
                }
                $stmt->execute();
                if ($stmt->rowCount() > 0) {
                    $deleted = true;
                }
            }
            return $deleted;
        } catch (PDOException $e) {
            error_log("Error deleting session by token or device: " . $e->getMessage());
            return false;
        }
    }

    public function deactivateAllUserSessions($userId, $userType) {
        $query = "UPDATE " . $this->table_name . " 
                  SET is_active = 0 
                  WHERE user_id = :user_id 
                  AND user_type = :user_type";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->bindParam(':user_type', $userType);
            
            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error deactivating user sessions: " . $e->getMessage());
            return false;
        }
    }

    public function cleanupExpiredSessions() {
        $query = "DELETE FROM " . $this->table_name . " 
                  WHERE expires_at < NOW()";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return $stmt->rowCount();
        } catch(PDOException $e) {
            error_log("Error cleaning up expired sessions: " . $e->getMessage());
            return false;
        }
    }
}
