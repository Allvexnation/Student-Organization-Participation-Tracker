<?php

require_once __DIR__ . '/../../model/AuditLogs/AdviserAuditLogModel.php';
require_once __DIR__ . '/../../config/jwt.php';

class AdviserAuditLogsController {
    private $model;

    public function __construct() {
        $this->model = new AdviserAuditLogModel();
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
        error_log("Adviser audit log data received: " . json_encode($data));
        
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

        error_log("Adviser audit log data to save: " . json_encode($logData));
        
        $logId = $this->model->create($logData);
        
        if ($logId) {
            return [
                'success' => true,
                'message' => 'Adviser audit log created successfully',
                'log_id' => $logId
            ];
        }

        error_log("Failed to create adviser audit log");
        return [
            'success' => false,
            'message' => 'Failed to create adviser audit log'
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
                
                $orgIds = [];
                $membershipIds = [];
                $studentIds = [];
                $eventIds = [];
                $taskIds = [];
                $attendanceIds = [];

                if ($adviserId) {
                    try {
                        $database = Database::getInstance();
                        $db = $database->getConnection();

                        $stmtOrg = $db->prepare("SELECT id FROM organizations WHERE adviser_id = :adviser_id");
                        $stmtOrg->bindParam(':adviser_id', $adviserId, PDO::PARAM_INT);
                        $stmtOrg->execute();
                        $orgIds = $stmtOrg->fetchAll(PDO::FETCH_COLUMN);

                        $stmtAdv = $db->prepare("SELECT current_organization_id FROM advisers WHERE id = :adviser_id");
                        $stmtAdv->bindParam(':adviser_id', $adviserId, PDO::PARAM_INT);
                        $stmtAdv->execute();
                        $currOrg = $stmtAdv->fetchColumn();
                        if ($currOrg && !in_array($currOrg, $orgIds)) {
                            $orgIds[] = (int)$currOrg;
                        }

                        if (!empty($orgIds)) {
                            $placeholders = implode(',', array_fill(0, count($orgIds), '?'));
                            $stmtMem = $db->prepare("SELECT id, student_id FROM organization_memberships WHERE organization_id IN ($placeholders)");
                            $stmtMem->execute($orgIds);
                            $memberships = $stmtMem->fetchAll(PDO::FETCH_ASSOC);
                            foreach ($memberships as $m) {
                                if (!empty($m['id'])) $membershipIds[] = (int)$m['id'];
                                if (!empty($m['student_id'])) $studentIds[] = (int)$m['student_id'];
                            }

                            try {
                                $stmtEvents = $db->prepare("SELECT event_id FROM event_organizations WHERE organization_id IN ($placeholders)");
                                $stmtEvents->execute($orgIds);
                                $eventIds = $stmtEvents->fetchAll(PDO::FETCH_COLUMN);
                            } catch (Exception $e) {
                                error_log("Error retrieving adviser event associations: " . $e->getMessage());
                            }

                            try {
                                $stmtTasks = $db->prepare("SELECT id FROM member_tasks WHERE organization_id IN ($placeholders)");
                                $stmtTasks->execute($orgIds);
                                $taskIds = $stmtTasks->fetchAll(PDO::FETCH_COLUMN);
                            } catch (Exception $e) {
                                error_log("Error retrieving adviser task associations: " . $e->getMessage());
                            }

                            try {
                                $stmtAtt = $db->prepare("SELECT id FROM attendances WHERE organization_id IN ($placeholders)");
                                $stmtAtt->execute($orgIds);
                                $attendanceIds = $stmtAtt->fetchAll(PDO::FETCH_COLUMN);
                            } catch (Exception $e) {
                                error_log("Error retrieving adviser attendance associations: " . $e->getMessage());
                            }
                        }
                    } catch (Exception $e) {
                        error_log("Error retrieving adviser associations: " . $e->getMessage());
                    }
                }

                $filters['organization_ids'] = array_values(array_unique($orgIds));
                $filters['membership_ids'] = array_values(array_unique($membershipIds));
                $filters['student_ids'] = array_values(array_unique($studentIds));
                $filters['event_ids'] = array_values(array_unique($eventIds));
                $filters['task_ids'] = array_values(array_unique($taskIds));
                $filters['attendance_ids'] = array_values(array_unique($attendanceIds));
            } elseif ($user['role'] !== 'admin') {
                http_response_code(403);
                return ['success' => false, 'message' => 'Access denied. Admin or adviser only.'];
            }

            $logs = $this->model->getAll($filters);
            $total = $this->model->count($filters);

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
            return ['success' => false, 'message' => 'Adviser audit log not found'];
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
            return ['success' => true, 'message' => 'Adviser audit log deleted successfully'];
        } else {
            http_response_code(404);
            return ['success' => false, 'message' => 'Failed to delete adviser audit log'];
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
            return ['success' => true, 'message' => "Old adviser logs (older than $days days) deleted successfully"];
        } else {
            return ['success' => false, 'message' => 'Failed to delete old adviser logs'];
        }
    }
}
