<?php

require_once __DIR__ . '/../../model/AuditLogs/AuditLogsModel.php';
require_once __DIR__ . '/../../config/jwt.php';
require_once __DIR__ . '/../../utils/AuditLogScope.php';

class AuditLogsController {
    private $model;

    public function __construct() {
        $this->model = new AuditLogsModel();
    }

    private function authenticate() {
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token || !JWT::validate($token)) {
            return null;
        }
        
        return JWT::decode($token);
    }

    public function logChange($data) {
        error_log("Audit log data received: " . json_encode($data));
        
        $logData = [
            'user_id' => $data['user_id'],
            'user_type' => $data['user_type'],
            'action' => $data['action'],
            'table_name' => $data['table_name'],
            'record_id' => $data['record_id'] ?? null,
            'field_name' => $data['field_name'] ?? null,
            'old_value' => $data['old_value'] ?? null,
            'new_value' => $data['new_value'] ?? null,
            'ip_address' => $data['ip_address'] ?? null,
            'device_type' => $data['device_type'] ?? null,
            'device_brand' => $data['device_brand'] ?? null,
            'browser' => $data['browser'] ?? null,
            'os' => $data['os'] ?? null,
            'user_agent' => $data['user_agent'] ?? null,
            'screen_resolution' => $data['screen_resolution'] ?? null
        ];

        error_log("Audit log data to save: " . json_encode($logData));
        
        $logId = $this->model->create($logData);
        
        if ($logId) {
            return [
                'success' => true,
                'message' => 'Audit log created successfully',
                'log_id' => $logId
            ];
        }

        error_log("Failed to create audit log");
        return [
            'success' => false,
            'message' => 'Failed to create audit log'
        ];
    }

    public function getAllLogs() {
        try {
            $user = $this->authenticate();
            
            if (!$user) {
                http_response_code(401);
                return ['success' => false, 'message' => 'Unauthorized'];
            }

            $filters = [
                'user_type' => $_GET['user_type'] ?? null,
                'table_name' => $_GET['table_name'] ?? null,
                'action' => $_GET['action'] ?? null,
                'start_date' => $_GET['start_date'] ?? null,
                'end_date' => $_GET['end_date'] ?? null,
                'limit' => isset($_GET['limit']) ? (int)$_GET['limit'] : 100,
                'offset' => isset($_GET['offset']) ? (int)$_GET['offset'] : 0
            ];

            if ($user['role'] === 'adviser') {
                $adviserId = $user['user_id'] ?? $user['id'] ?? null;
                $filters['adviser_id'] = $adviserId;
                $filters = AuditLogScope::merge($filters, AuditLogScope::forAdviser($adviserId));
            } elseif ($user['role'] === 'student') {
                $studentId = $user['user_id'] ?? $user['id'] ?? null;
                $filters['student_id'] = $studentId;
                $filters = AuditLogScope::merge($filters, AuditLogScope::forStudent($studentId));
            } elseif ($user['role'] !== 'admin') {
                http_response_code(403);
                return ['success' => false, 'message' => 'Access denied.'];
            }

            $logs = $this->model->getAll($filters);
            $total = $this->model->count($filters);

            if ($user['role'] === 'student') {
                $logs = AuditLogScope::redactForStudent($logs);
            }

            return [
                'success' => true,
                'data' => $logs,
                'total' => $total,
                'filters' => $filters
            ];
        } catch (Exception $e) {
            error_log("Error in getAllLogs: " . $e->getMessage());
            http_response_code(500);
            return ['success' => false, 'message' => 'Server error: ' . $e->getMessage()];
        }
    }

    public function getLogById($id) {
        $user = $this->authenticate();
        
        if (!$user || $user['role'] !== 'admin') {
            http_response_code(403);
            return ['success' => false, 'message' => 'Access denied. Admin only.'];
        }

        $log = $this->model->getById($id);

        if ($log) {
            return ['success' => true, 'data' => $log];
        } else {
            http_response_code(404);
            return ['success' => false, 'message' => 'Audit log not found'];
        }
    }

    public function getLogsByUser($userId, $userType) {
        $user = $this->authenticate();
        
        if (!$user) {
            http_response_code(401);
            return ['success' => false, 'message' => 'Unauthorized'];
        }

        $callerId = $user['user_id'] ?? $user['id'] ?? null;
        if ($user['role'] !== 'admin' && 
            ($callerId != $userId || $user['role'] !== $userType)) {
            http_response_code(403);
            return ['success' => false, 'message' => 'Access denied'];
        }

        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        $logs = $this->model->getByUserId($userId, $userType, $limit);

        return ['success' => true, 'data' => $logs];
    }

    public function getLogsByRecord($tableName, $recordId) {
        $user = $this->authenticate();
        
        if (!$user || $user['role'] !== 'admin') {
            http_response_code(403);
            return ['success' => false, 'message' => 'Access denied. Admin only.'];
        }

        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        $logs = $this->model->getByRecordId($tableName, $recordId, $limit);

        return ['success' => true, 'data' => $logs];
    }

    public function deleteLog($id) {
        $user = $this->authenticate();
        
        if (!$user || $user['role'] !== 'admin') {
            http_response_code(403);
            return ['success' => false, 'message' => 'Access denied. Admin only.'];
        }

        $result = $this->model->delete($id);

        if ($result) {
            return ['success' => true, 'message' => 'Audit log deleted successfully'];
        } else {
            http_response_code(404);
            return ['success' => false, 'message' => 'Failed to delete audit log'];
        }
    }

    public function deleteOldLogs() {
        $user = $this->authenticate();
        
        if (!$user || $user['role'] !== 'admin') {
            http_response_code(403);
            return ['success' => false, 'message' => 'Access denied. Admin only.'];
        }

        $days = isset($_GET['days']) ? (int)$_GET['days'] : 90;
        $result = $this->model->deleteOldLogs($days);

        if ($result) {
            return ['success' => true, 'message' => "Old logs (older than $days days) deleted successfully"];
        } else {
            return ['success' => false, 'message' => 'Failed to delete old logs'];
        }
    }
}
