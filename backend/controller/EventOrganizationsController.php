<?php

require_once __DIR__ . '/../model/EventOrganizationsModel.php';
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../cache/CacheService.php';

class EventOrganizationsController {
    private $eventOrganizationsModel;

    public function __construct() {
        $this->eventOrganizationsModel = new EventOrganizationsModel();
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

        $eventOrganizations = $this->eventOrganizationsModel->readAll();

        if ($eventOrganizations !== false) {
            http_response_code(200);
            echo json_encode(['event_organizations' => $eventOrganizations]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to fetch event organizations']);
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

        $eventOrganization = $this->eventOrganizationsModel->readOne($id);

        if ($eventOrganization) {
            http_response_code(200);
            echo json_encode(['event_organization' => $eventOrganization]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Event organization not found']);
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

        if (!isset($data['event_id']) || !isset($data['approver_id'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $orgIds = [];
        if (isset($data['organization_ids']) && is_array($data['organization_ids'])) {
            $orgIds = $data['organization_ids'];
        } elseif (isset($data['organization_id'])) {
            $orgIds = [$data['organization_id']];
        }

        if (empty($orgIds)) {
            http_response_code(400);
            echo json_encode(['message' => 'Please select at least one organization']);
            return;
        }

        $status = isset($data['status']) ? $data['status'] : 'registered';
        $registeredAt = isset($data['registered_at']) ? $data['registered_at'] : date('Y-m-d H:i:s');

        $createdIds = [];
        $skippedCount = 0;

        foreach ($orgIds as $orgId) {
            $orgId = (int)$orgId;
            $existing = $this->eventOrganizationsModel->checkExisting($data['event_id'], $orgId);
            if ($existing) {
                $skippedCount++;
                continue;
            }

            $regData = [
                'event_id' => $data['event_id'],
                'organization_id' => $orgId,
                'approver_id' => $data['approver_id'],
                'status' => $status,
                'registered_at' => $registeredAt
            ];

            $result = $this->eventOrganizationsModel->create($regData);
            if ($result) {
                $createdIds[] = $result;
            }
        }

        if (!empty($createdIds)) {
            CacheService::forget('events_public');
            http_response_code(201);
            echo json_encode([
                'message' => 'Event organization(s) registered successfully',
                'id' => $createdIds[0],
                'ids' => $createdIds,
                'created_count' => count($createdIds),
                'skipped_count' => $skippedCount
            ]);
        } elseif ($skippedCount > 0) {
            http_response_code(409);
            echo json_encode(['message' => 'The selected organization(s) are already registered for this event']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to register event organization']);
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

        if (!isset($data['event_id']) || !isset($data['organization_id']) || !isset($data['approver_id'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        if (!isset($data['status'])) {
            $data['status'] = 'registered';
        }

        $result = $this->eventOrganizationsModel->update($id, $data);

        if ($result) {
            CacheService::forget('events_public');
            $eventOrganization = $this->eventOrganizationsModel->readOne($id);
            http_response_code(200);
            echo json_encode([
                'message' => 'Event organization updated successfully',
                'event_organization' => $eventOrganization
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update event organization']);
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

        $result = $this->eventOrganizationsModel->delete($id);

        if ($result) {
            CacheService::forget('events_public');
            http_response_code(200);
            echo json_encode(['message' => 'Event organization deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to delete event organization']);
        }
    }

    public function getApprovers() {
        header('Content-Type: application/json');

        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;

        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $approvers = $this->eventOrganizationsModel->getAllApprovers();

        $crtAdminEmail = getenv('CRT_ADMIN_EMAIL');
        if ($approvers !== false && is_array($approvers)) {
            $approvers = array_filter($approvers, function($approver) use ($crtAdminEmail) {
                if (isset($approver['type']) && $approver['type'] === 'admin' && isset($approver['email'])) {
                    return strtolower($approver['email']) !== strtolower($crtAdminEmail);
                }
                return true;
            });
            $approvers = array_values($approvers);
        }

        if ($approvers !== false) {
            http_response_code(200);
            echo json_encode(['approvers' => $approvers]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to fetch approvers']);
        }
    }
}
