<?php

require_once __DIR__ . '/../../config/db.php';

class BannedModel {
    private $conn;
    private $table_name = "bans";

    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
    }

    public function create($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (ban_type, target_type, target_id, session_id, ip_address, reason, banned_by, ban_duration_type, expires_at) 
                  VALUES (:ban_type, :target_type, :target_id, :session_id, :ip_address, :reason, :banned_by, :ban_duration_type, :expires_at)";

        try {
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':ban_type', $data['ban_type']);
            $stmt->bindParam(':target_type', $data['target_type']);
            $stmt->bindParam(':target_id', $data['target_id']);
            $stmt->bindParam(':session_id', $data['session_id']);
            $stmt->bindParam(':ip_address', $data['ip_address']);
            $stmt->bindParam(':reason', $data['reason']);
            $stmt->bindParam(':banned_by', $data['banned_by']);
            $stmt->bindParam(':ban_duration_type', $data['ban_duration_type']);
            $stmt->bindParam(':expires_at', $data['expires_at']);
            
            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error creating ban: " . $e->getMessage());
            return false;
        }
    }

    public function checkBanBySession($sessionId, $ipAddress = null) {
        $query = "SELECT b.*, a.name as admin_name, a.username as admin_username 
                  FROM " . $this->table_name . " b
                  LEFT JOIN admins a ON b.banned_by = a.id
                  WHERE b.is_active = 1 
                  AND (b.session_id = :session_id";
        
        if ($ipAddress) {
            $query .= " OR b.ip_address = :ip_address";
        }
        
        $query .= ") AND (b.expires_at IS NULL OR b.expires_at > NOW())
                  ORDER BY b.created_at DESC
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':session_id', $sessionId);
            if ($ipAddress) {
                $stmt->bindParam(':ip_address', $ipAddress);
            }
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            error_log("Error checking ban by session: " . $e->getMessage());
            return false;
        }
    }

    public function checkBanByTarget($targetType, $targetId) {
        $query = "SELECT b.*, a.name as admin_name, a.username as admin_username 
                  FROM " . $this->table_name . " b
                  LEFT JOIN admins a ON b.banned_by = a.id
                  WHERE b.is_active = 1 
                  AND b.target_type = :target_type 
                  AND b.target_id = :target_id
                  AND (b.expires_at IS NULL OR b.expires_at > NOW())
                  ORDER BY b.created_at DESC
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':target_type', $targetType);
            $stmt->bindParam(':target_id', $targetId);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            error_log("Error checking ban by target: " . $e->getMessage());
            return false;
        }
    }

    public function checkBanByIP($ipAddress) {
        $query = "SELECT b.*, a.name as admin_name, a.username as admin_username 
                  FROM " . $this->table_name . " b
                  LEFT JOIN admins a ON b.banned_by = a.id
                  WHERE b.is_active = 1 
                  AND b.ip_address = :ip_address
                  AND (b.expires_at IS NULL OR b.expires_at > NOW())
                  ORDER BY b.created_at DESC
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':ip_address', $ipAddress);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            error_log("Error checking ban by IP: " . $e->getMessage());
            return false;
        }
    }

    public function checkOverallBan($targetType, $targetId, $ipAddress = null) {
        $query = "SELECT b.*, a.name as admin_name, a.username as admin_username 
                  FROM " . $this->table_name . " b
                  LEFT JOIN admins a ON b.banned_by = a.id
                  WHERE b.is_active = 1 
                  AND ((b.target_type = :target_type AND b.target_id = :target_id)";
        
        if ($ipAddress) {
            $query .= " OR b.ip_address = :ip_address";
        }
        
        $query .= ") AND (b.expires_at IS NULL OR b.expires_at > NOW())
                  ORDER BY b.created_at DESC
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':target_type', $targetType);
            $stmt->bindParam(':target_id', $targetId);
            if ($ipAddress) {
                $stmt->bindParam(':ip_address', $ipAddress);
            }
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            error_log("Error checking overall ban: " . $e->getMessage());
            return false;
        }
    }

    public function getBanInfo($sessionId = null, $ipAddress = null, $targetType = null, $targetId = null) {
        $query = "SELECT b.*, a.name as admin_name, a.username as admin_username,
                  CASE 
                    WHEN b.target_type = 'admin' THEN (SELECT name FROM admins WHERE id = b.target_id)
                    WHEN b.target_type = 'adviser' THEN (SELECT name FROM advisers WHERE id = b.target_id)
                    WHEN b.target_type = 'student' THEN (SELECT CONCAT(first_name, ' ', last_name) FROM students WHERE id = b.target_id)
                    ELSE NULL
                  END as target_name,
                  s.ip_address as session_ip, s.user_type, s.device_type, s.browser, s.os
                  FROM " . $this->table_name . " b
                  LEFT JOIN admins a ON b.banned_by = a.id
                  LEFT JOIN sessions s ON b.session_id = s.id
                  WHERE b.is_active = 1 
                  AND (b.expires_at IS NULL OR b.expires_at > NOW())";

        $conditions = [];
        $params = [];

        if ($sessionId) {
            $conditions[] = "b.session_id = :session_id";
            $params[':session_id'] = $sessionId;
        }

        if ($ipAddress) {
            $conditions[] = "b.ip_address = :ip_address";
            $params[':ip_address'] = $ipAddress;
        }

        if ($targetType && $targetId) {
            $conditions[] = "(b.target_type = :target_type AND b.target_id = :target_id)";
            $params[':target_type'] = $targetType;
            $params[':target_id'] = $targetId;
        }

        if (!empty($conditions)) {
            $query .= " AND (" . implode(" OR ", $conditions) . ")";
        }

        $query .= " ORDER BY b.created_at DESC LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            foreach ($params as $key => $value) {
                $stmt->bindParam($key, $value);
            }
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            error_log("Error getting ban info: " . $e->getMessage());
            return false;
        }
    }

    public function getAllBans() {
        $query = "SELECT b.*, a.name as admin_name, a.username as admin_username,
                  CASE 
                    WHEN b.target_type = 'admin' THEN (SELECT name FROM admins WHERE id = b.target_id)
                    WHEN b.target_type = 'adviser' THEN (SELECT name FROM advisers WHERE id = b.target_id)
                    WHEN b.target_type = 'student' THEN (SELECT CONCAT(first_name, ' ', last_name) FROM students WHERE id = b.target_id)
                    ELSE NULL
                  END as target_name,
                  s.ip_address as session_ip, s.user_type
                  FROM " . $this->table_name . " b
                  LEFT JOIN admins a ON b.banned_by = a.id
                  LEFT JOIN sessions s ON b.session_id = s.id
                  ORDER BY b.created_at DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            error_log("Error getting all bans: " . $e->getMessage());
            return false;
        }
    }

    public function deactivateBan($banId) {
        $query = "UPDATE " . $this->table_name . "
                  SET is_active = 0
                  WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $banId);

            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error deactivating ban: " . $e->getMessage());
            return false;
        }
    }

    public function activateBan($banId) {

        $query = "SELECT ban_duration_type, expires_at, created_at FROM " . $this->table_name . " WHERE id = :id";
        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $banId);
            $stmt->execute();
            $ban = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$ban) {
                return false;
            }

            if ($ban['ban_duration_type'] === 'temporary' && $ban['expires_at']) {
                $created = new DateTime($ban['created_at']);
                $originalExpires = new DateTime($ban['expires_at']);

                $durationSeconds = abs($originalExpires->getTimestamp() - $created->getTimestamp());

                $now = new DateTime();
                $now->add(new DateInterval('PT' . $durationSeconds . 'S'));
                $newExpiresAt = $now->format('Y-m-d H:i:s');

                $updateQuery = "UPDATE " . $this->table_name . "
                               SET is_active = 1, expires_at = :expires_at
                               WHERE id = :id";
                $stmt = $this->conn->prepare($updateQuery);
                $stmt->bindParam(':id', $banId);
                $stmt->bindParam(':expires_at', $newExpiresAt);

                if($stmt->execute()) {
                    error_log("Activate ban: ID=$banId, Reset expires_at to $newExpiresAt (duration: $durationSeconds seconds)");
                    return true;
                }
            }

            $query = "UPDATE " . $this->table_name . "
                      SET is_active = 1
                      WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $banId);

            if($stmt->execute()) {
                $rowCount = $stmt->rowCount();
                error_log("Activate ban: ID=$banId, Rows affected=$rowCount");
                return true;
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error activating ban: " . $e->getMessage());
            return false;
        }
    }

    public function cleanupExpiredBans() {
        $query = "UPDATE " . $this->table_name . "
                  SET is_active = 0
                  WHERE expires_at < NOW() AND is_active = 1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return $stmt->rowCount();
        } catch(PDOException $e) {
            error_log("Error cleaning up expired bans: " . $e->getMessage());
            return false;
        }
    }

    public function deleteBan($banId) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $banId);

            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error deleting ban: " . $e->getMessage());
            return false;
        }
    }
}
