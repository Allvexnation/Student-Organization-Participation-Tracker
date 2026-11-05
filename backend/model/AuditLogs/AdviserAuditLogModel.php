<?php

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../utils/AuditLogScope.php';

class AdviserAuditLogModel {
    private $conn;
    private $table = 'adviser_audit_logs';

    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
    }

    public function create($data) {
        $query = "INSERT INTO " . $this->table . "
            (user_id, user_type, action, table_name, record_id, field_name, old_value, new_value,
             ip_address, device_type, device_brand, browser, os, user_agent, screen_resolution)
            VALUES
            (:user_id, :user_type, :action, :table_name, :record_id, :field_name, :old_value, :new_value,
             :ip_address, :device_type, :device_brand, :browser, :os, :user_agent, :screen_resolution)";

        $stmt = $this->conn->prepare($query);

        $userId = $data['user_id'] ?? null;
        $userType = $data['user_type'] ?? null;
        $action = $data['action'] ?? null;
        $tableName = $data['table_name'] ?? null;
        $recordId = $data['record_id'] ?? null;
        $fieldName = $data['field_name'] ?? null;
        $oldValue = $data['old_value'] ?? null;
        $newValue = $data['new_value'] ?? null;
        $ipAddress = $data['ip_address'] ?? null;
        $deviceType = $data['device_type'] ?? null;
        $deviceBrand = $data['device_brand'] ?? null;
        $browser = $data['browser'] ?? null;
        $os = $data['os'] ?? null;
        $userAgent = $data['user_agent'] ?? null;
        $screenResolution = $data['screen_resolution'] ?? null;

        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindParam(':user_type', $userType);
        $stmt->bindParam(':action', $action);
        $stmt->bindParam(':table_name', $tableName);
        $stmt->bindParam(':record_id', $recordId, PDO::PARAM_INT);
        $stmt->bindParam(':field_name', $fieldName);
        $stmt->bindParam(':old_value', $oldValue);
        $stmt->bindParam(':new_value', $newValue);
        $stmt->bindParam(':ip_address', $ipAddress);
        $stmt->bindParam(':device_type', $deviceType);
        $stmt->bindParam(':device_brand', $deviceBrand);
        $stmt->bindParam(':browser', $browser);
        $stmt->bindParam(':os', $os);
        $stmt->bindParam(':user_agent', $userAgent);
        $stmt->bindParam(':screen_resolution', $screenResolution);

        try {
            if ($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
        } catch (PDOException $e) {
            error_log("AdviserAuditLogModel create error: " . $e->getMessage());
        }

        return false;
    }

    public function getAll($filters = []) {
        $query = "SELECT al.*, 
                    CASE al.user_type
                        WHEN 'admin' THEN (SELECT name FROM admins WHERE id = al.user_id)
                        WHEN 'adviser' THEN (SELECT name FROM advisers WHERE id = al.user_id)
                        WHEN 'student' THEN (SELECT CONCAT(first_name, ' ', last_name) FROM students WHERE id = al.user_id)
                    END as user_name
                  FROM " . $this->table . " al WHERE 1=1";

        if (!empty($filters['user_type'])) {
            $query .= " AND al.user_type = :user_type";
        }

        if (!empty($filters['table_name'])) {
            if ($filters['table_name'] === 'tasks') {
                $query .= " AND al.table_name IN ('tasks', 'member_tasks')";
            } elseif ($filters['table_name'] === 'attendance') {
                $query .= " AND al.table_name IN ('attendance', 'attendances')";
            } else {
                $query .= " AND al.table_name = :table_name";
            }
        }

        if (!empty($filters['action'])) {
            $query .= " AND al.action = :action";
        }

        if (!empty($filters['start_date'])) {
            $query .= " AND al.created_at >= :start_date";
        }

        if (!empty($filters['end_date'])) {
            $query .= " AND al.created_at <= :end_date";
        }

        $query .= AuditLogScope::visibilitySql('al', $filters);

        $query .= " ORDER BY al.created_at DESC";

        if (!empty($filters['limit'])) {
            $query .= " LIMIT :limit";
            if (!empty($filters['offset'])) {
                $query .= " OFFSET :offset";
            }
        }

        $stmt = $this->conn->prepare($query);

        if (!empty($filters['user_type'])) {
            $stmt->bindParam(':user_type', $filters['user_type']);
        }

        if (!empty($filters['table_name']) && $filters['table_name'] !== 'tasks' && $filters['table_name'] !== 'attendance') {
            $stmt->bindParam(':table_name', $filters['table_name']);
        }

        if (!empty($filters['action'])) {
            $stmt->bindParam(':action', $filters['action']);
        }

        if (!empty($filters['start_date'])) {
            $stmt->bindParam(':start_date', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $stmt->bindParam(':end_date', $filters['end_date']);
        }

        if (!empty($filters['limit'])) {
            $stmt->bindParam(':limit', $filters['limit'], PDO::PARAM_INT);
            if (!empty($filters['offset'])) {
                $stmt->bindParam(':offset', $filters['offset'], PDO::PARAM_INT);
            }
        }

        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($id) {
        $query = "SELECT al.*, 
                    CASE al.user_type
                        WHEN 'admin' THEN (SELECT name FROM admins WHERE id = al.user_id)
                        WHEN 'adviser' THEN (SELECT name FROM advisers WHERE id = al.user_id)
                        WHEN 'student' THEN (SELECT CONCAT(first_name, ' ', last_name) FROM students WHERE id = al.user_id)
                    END as user_name
                  FROM " . $this->table . " al 
                  WHERE al.id = :id LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getByUserId($userId, $userType, $limit = 50) {
        $query = "SELECT * FROM " . $this->table . " 
                  WHERE user_id = :user_id AND user_type = :user_type 
                  ORDER BY created_at DESC LIMIT :limit";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':user_type', $userType);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getByRecordId($tableName, $recordId, $limit = 50) {
        $query = "SELECT al.*, 
                    CASE al.user_type
                        WHEN 'admin' THEN (SELECT name FROM admins WHERE id = al.user_id)
                        WHEN 'adviser' THEN (SELECT name FROM advisers WHERE id = al.user_id)
                        WHEN 'student' THEN (SELECT name FROM students WHERE id = al.user_id)
                    END as user_name
                  FROM " . $this->table . " al 
                  WHERE al.table_name = :table_name AND al.record_id = :record_id 
                  ORDER BY al.created_at DESC LIMIT :limit";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':table_name', $tableName);
        $stmt->bindParam(':record_id', $recordId);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function delete($id) {
        $query = "DELETE FROM " . $this->table . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);

        return $stmt->execute();
    }

    public function deleteOldLogs($days = 90) {
        $query = "DELETE FROM " . $this->table . " 
                  WHERE created_at < DATE_SUB(NOW(), INTERVAL :days DAY)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':days', $days, PDO::PARAM_INT);

        return $stmt->execute();
    }

    public function count($filters = []) {
        $query = "SELECT COUNT(*) as count FROM " . $this->table . " WHERE 1=1";

        if (!empty($filters['user_type'])) {
            $query .= " AND user_type = :user_type";
        }

        if (!empty($filters['table_name'])) {
            if ($filters['table_name'] === 'tasks') {
                $query .= " AND table_name IN ('tasks', 'member_tasks')";
            } elseif ($filters['table_name'] === 'attendance') {
                $query .= " AND table_name IN ('attendance', 'attendances')";
            } else {
                $query .= " AND table_name = :table_name";
            }
        }

        if (!empty($filters['action'])) {
            $query .= " AND action = :action";
        }

        if (!empty($filters['start_date'])) {
            $query .= " AND created_at >= :start_date";
        }

        if (!empty($filters['end_date'])) {
            $query .= " AND created_at <= :end_date";
        }

        $query .= AuditLogScope::visibilitySql('', $filters);

        $stmt = $this->conn->prepare($query);

        if (!empty($filters['user_type'])) {
            $stmt->bindParam(':user_type', $filters['user_type']);
        }

        if (!empty($filters['table_name']) && $filters['table_name'] !== 'tasks' && $filters['table_name'] !== 'attendance') {
            $stmt->bindParam(':table_name', $filters['table_name']);
        }

        if (!empty($filters['action'])) {
            $stmt->bindParam(':action', $filters['action']);
        }

        if (!empty($filters['start_date'])) {
            $stmt->bindParam(':start_date', $filters['start_date']);
        }

        if (!empty($filters['end_date'])) {
            $stmt->bindParam(':end_date', $filters['end_date']);
        }

        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result['count'];
    }
}
