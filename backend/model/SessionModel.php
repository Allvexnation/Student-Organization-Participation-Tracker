<?php

require_once __DIR__ . '/../config/db.php';

class SessionModel {
    private $conn;
    private $table_name = "sessions";

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    public function create($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (user_id, user_type, token, expires_at, is_active) 
                  VALUES (:user_id, :user_type, :token, :expires_at, :is_active)";

        try {
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':user_id', $data['user_id']);
            $stmt->bindParam(':user_type', $data['user_type']);
            $stmt->bindParam(':token', $data['token']);
            $stmt->bindParam(':expires_at', $data['expires_at']);
            $stmt->bindParam(':is_active', $data['is_active']);
            
            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error creating session: " . $e->getMessage());
            return false;
        }
    }

    public function validateToken($token) {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE token = :token 
                  AND is_active = 1 
                  AND expires_at > NOW() 
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':token', $token);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            error_log("Error validating token: " . $e->getMessage());
            return false;
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
