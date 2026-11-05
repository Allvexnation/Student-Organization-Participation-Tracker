<?php

require_once __DIR__ . '/../../config/db.php';

class BannedModel {
    private $conn;
    private $table_name = "bans";

    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
    }

    private function normalizeExpiresAt($expiresAt) {
        if (empty($expiresAt)) {
            return null;
        }
        try {
            $dt = new DateTime($expiresAt);
            $dt->setTimezone(new DateTimeZone('UTC'));
            return $dt->format('Y-m-d H:i:s');
        } catch (Exception $e) {
            return $expiresAt;
        }
    }

    private function formatBanDates(&$ban) {
        if (!$ban || !is_array($ban)) {
            return;
        }
        if (!empty($ban['expires_at'])) {
            $ban['expires_at'] = gmdate('Y-m-d\TH:i:s\Z', strtotime($ban['expires_at']));
        } else {
            $ban['expires_at'] = null;
        }
        if (!empty($ban['created_at'])) {
            $ban['created_at'] = gmdate('Y-m-d\TH:i:s\Z', strtotime($ban['created_at']));
        }
        if (!empty($ban['updated_at'])) {
            $ban['updated_at'] = gmdate('Y-m-d\TH:i:s\Z', strtotime($ban['updated_at']));
        }
        $ban['is_active'] = isset($ban['is_active']) ? (int)$ban['is_active'] : 1;
        $ban['id'] = isset($ban['id']) ? (int)$ban['id'] : 0;
        if (!empty($ban['target_id'])) $ban['target_id'] = (int)$ban['target_id'];
        if (!empty($ban['session_id'])) $ban['session_id'] = (int)$ban['session_id'];
        if (!empty($ban['banned_by'])) $ban['banned_by'] = (int)$ban['banned_by'];
    }

    public function create($data) {
        if (!$this->conn) return false;
        $query = "INSERT INTO " . $this->table_name . " 
                  (ban_type, target_type, target_id, session_id, ip_address, reason, banned_by, ban_duration_type, expires_at) 
                  VALUES (:ban_type, :target_type, :target_id, :session_id, :ip_address, :reason, :banned_by, :ban_duration_type, :expires_at)";

        try {
            $expiresAt = $this->normalizeExpiresAt($data['expires_at'] ?? null);

            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':ban_type', $data['ban_type']);
            $stmt->bindParam(':target_type', $data['target_type']);
            $stmt->bindParam(':target_id', $data['target_id']);
            $stmt->bindParam(':session_id', $data['session_id']);
            $stmt->bindParam(':ip_address', $data['ip_address']);
            $stmt->bindParam(':reason', $data['reason']);
            $stmt->bindParam(':banned_by', $data['banned_by']);
            $stmt->bindParam(':ban_duration_type', $data['ban_duration_type']);
            $stmt->bindParam(':expires_at', $expiresAt);
            
            if($stmt->execute()) {
                return (int)$this->conn->lastInsertId();
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error creating ban: " . $e->getMessage());
            return false;
        }
    }

    public function update($banId, $data) {
        if (!$this->conn) return false;
        $fields = [];
        $params = [':id' => $banId];

        if (isset($data['reason'])) {
            $fields[] = "reason = :reason";
            $params[':reason'] = $data['reason'];
        }
        if (isset($data['ban_type'])) {
            $fields[] = "ban_type = :ban_type";
            $params[':ban_type'] = $data['ban_type'];
        }
        if (isset($data['target_type'])) {
            $fields[] = "target_type = :target_type";
            $params[':target_type'] = $data['target_type'];
        }
        if (isset($data['target_id'])) {
            $fields[] = "target_id = :target_id";
            $params[':target_id'] = $data['target_id'];
        }
        if (isset($data['ip_address'])) {
            $fields[] = "ip_address = :ip_address";
            $params[':ip_address'] = $data['ip_address'];
        }
        if (isset($data['ban_duration_type'])) {
            $fields[] = "ban_duration_type = :ban_duration_type";
            $params[':ban_duration_type'] = $data['ban_duration_type'];

            if ($data['ban_duration_type'] === 'permanent') {
                $fields[] = "expires_at = NULL";
            } elseif (isset($data['expires_at'])) {
                $fields[] = "expires_at = :expires_at";
                $params[':expires_at'] = $this->normalizeExpiresAt($data['expires_at']);
            }
        } elseif (isset($data['expires_at'])) {
            $fields[] = "expires_at = :expires_at";
            $params[':expires_at'] = $this->normalizeExpiresAt($data['expires_at']);
        }

        if (empty($fields)) {
            return true;
        }

        $query = "UPDATE " . $this->table_name . " SET " . implode(", ", $fields) . " WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            return $stmt->execute($params);
        } catch (PDOException $e) {
            error_log("Error updating ban {$banId}: " . $e->getMessage());
            return false;
        }
    }

    private function baseBanSelect() {
        return "SELECT b.*, 
                       a.name as admin_name, 
                       a.username as admin_username,
                       CASE 
                         WHEN b.target_type = 'admin' THEN (SELECT name FROM admins WHERE id = b.target_id)
                         WHEN b.target_type = 'adviser' THEN (SELECT name FROM advisers WHERE id = b.target_id)
                         WHEN b.target_type = 'student' THEN (SELECT CONCAT(first_name, ' ', last_name) FROM students WHERE id = b.target_id)
                         ELSE NULL
                       END as target_name,
                       s.ip_address as session_ip, s.user_type, s.device_type, s.browser, s.os
                FROM " . $this->table_name . " b
                LEFT JOIN admins a ON b.banned_by = a.id
                LEFT JOIN sessions s ON b.session_id = s.id";
    }

    public function getClientIp() {
        $ip = '';

        if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
            $ip = $_SERVER['HTTP_CF_CONNECTING_IP'];
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
        } elseif (!empty($_SERVER['HTTP_X_REAL_IP'])) {
            $ip = $_SERVER['HTTP_X_REAL_IP'];
        } elseif (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            $ip = $_SERVER['HTTP_CLIENT_IP'];
        } else {
            $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        }

        if (strpos($ip, ',') !== false) {
            $ips = explode(',', $ip);
            $ip = trim($ips[0]);
        }

        return trim($ip);
    }

    public function findActiveBan($targetType = null, $targetId = null, $sessionId = null, $ipAddress = null) {
        if (!$this->conn) return false;
        $this->cleanupExpiredBans();

        $conditions = [];
        $params = [];

        if (!empty($targetType) && !empty($targetId)) {
            $conditions[] = "(b.target_type = :target_type AND b.target_id = :target_id)";
            $params[':target_type'] = $targetType;
            $params[':target_id'] = $targetId;
        }

        if (!empty($sessionId)) {
            $conditions[] = "(b.session_id = :session_id)";
            $params[':session_id'] = $sessionId;
        }

        if (!empty($ipAddress)) {
            $rawCandidates = is_array($ipAddress) ? $ipAddress : explode(',', (string)$ipAddress);
            $candidates = [];
            foreach ($rawCandidates as $raw) {
                $trimmed = trim((string)$raw);
                if ($trimmed !== '') {
                    $candidates[] = $trimmed;
                    if ($trimmed === '::1' || $trimmed === '127.0.0.1' || $trimmed === 'localhost') {
                        $candidates[] = '127.0.0.1';
                        $candidates[] = '::1';
                        $candidates[] = 'localhost';
                    }
                }
            }
            $candidates = array_values(array_unique($candidates));

            if (!empty($candidates)) {
                $ipOrs = [];
                foreach ($candidates as $i => $cand) {
                    $pKey = ':ip_cand_' . $i;
                    $ipOrs[] = "(b.ip_address = {$pKey} OR (b.session_id IS NOT NULL AND s.ip_address = {$pKey}))";
                    $params[$pKey] = $cand;
                }
                $conditions[] = "(" . implode(" OR ", $ipOrs) . ")";
            }
        }

        if (empty($conditions)) {
            return false;
        }

        $query = $this->baseBanSelect() . "
                  WHERE b.is_active = 1 
                  AND (b.ban_duration_type = 'permanent' OR b.expires_at IS NULL OR b.expires_at > UTC_TIMESTAMP())
                  AND (" . implode(" OR ", $conditions) . ")
                  ORDER BY b.created_at DESC
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute($params);
            $ban = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($ban) {
                $this->formatBanDates($ban);
                return $ban;
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error finding active ban: " . $e->getMessage());
            return false;
        }
    }

    public function checkBanBySession($sessionId, $ipAddress = null) {
        return $this->findActiveBan(null, null, $sessionId, $ipAddress);
    }

    public function checkBanByTarget($targetType, $targetId) {
        return $this->findActiveBan($targetType, $targetId, null, null);
    }

    public function checkBanByIP($ipAddress) {
        return $this->findActiveBan(null, null, null, $ipAddress);
    }

    public function checkOverallBan($targetType, $targetId, $ipAddress = null) {
        return $this->findActiveBan($targetType, $targetId, null, $ipAddress);
    }

    public function getBanInfo($sessionId = null, $ipAddress = null, $targetType = null, $targetId = null) {
        return $this->findActiveBan($targetType, $targetId, $sessionId, $ipAddress);
    }

    public function getAllBans() {
        if (!$this->conn) return [];
        $this->cleanupExpiredBans();

        $query = $this->baseBanSelect() . " ORDER BY b.created_at DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $bans = $stmt->fetchAll(PDO::FETCH_ASSOC);
            if (is_array($bans)) {
                foreach ($bans as &$ban) {
                    $this->formatBanDates($ban);
                }
            }
            return $bans;
        } catch(PDOException $e) {
            error_log("Error getting all bans: " . $e->getMessage());
            return false;
        }
    }

    public function deactivateBan($banId) {
        if (!$this->conn) return false;
        $query = "UPDATE " . $this->table_name . "
                  SET is_active = 0
                  WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $banId);
            return $stmt->execute();
        } catch(PDOException $e) {
            error_log("Error deactivating ban: " . $e->getMessage());
            return false;
        }
    }

    public function activateBan($banId) {
        if (!$this->conn) return false;
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
                if ($durationSeconds <= 0) {
                    $durationSeconds = 3600; // default 1 hour fallback
                }

                $now = new DateTime('now', new DateTimeZone('UTC'));
                $now->add(new DateInterval('PT' . $durationSeconds . 'S'));
                $newExpiresAt = $now->format('Y-m-d H:i:s');

                $updateQuery = "UPDATE " . $this->table_name . "
                               SET is_active = 1, expires_at = :expires_at
                               WHERE id = :id";
                $stmt = $this->conn->prepare($updateQuery);
                $stmt->bindParam(':id', $banId);
                $stmt->bindParam(':expires_at', $newExpiresAt);

                return $stmt->execute();
            }

            $query = "UPDATE " . $this->table_name . "
                      SET is_active = 1
                      WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $banId);

            return $stmt->execute();
        } catch(PDOException $e) {
            error_log("Error activating ban: " . $e->getMessage());
            return false;
        }
    }

    public function cleanupExpiredBans() {
        if (!$this->conn) return 0;
        $query = "UPDATE " . $this->table_name . "
                  SET is_active = 0
                  WHERE is_active = 1 
                    AND ban_duration_type = 'temporary' 
                    AND expires_at IS NOT NULL 
                    AND expires_at <= UTC_TIMESTAMP()";

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
        if (!$this->conn) return false;
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $banId);
            return $stmt->execute();
        } catch(PDOException $e) {
            error_log("Error deleting ban: " . $e->getMessage());
            return false;
        }
    }
}
