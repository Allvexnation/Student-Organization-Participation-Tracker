<?php

require_once __DIR__ . '/../model/EventOrganizationsModel.php';
require_once __DIR__ . '/../config/jwt.php';

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

        if (!isset($data['event_id']) || !isset($data['organization_id']) || !isset($data['approver_id'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $existing = $this->eventOrganizationsModel->checkExisting($data['event_id'], $data['organization_id']);
        if ($existing) {
            http_response_code(409);
            echo json_encode(['message' => 'This organization is already registered for this event']);
            return;
        }

        $data['status'] = 'registered';
        $data['registered_at'] = date('Y-m-d H:i:s');

        $result = $this->eventOrganizationsModel->create($data);

        if ($result) {
            http_response_code(201);
            echo json_encode(['message' => 'Event organization registered successfully', 'id' => $result]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to register event organization', 'error' => 'This organization may already be registered for this event']);
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

        if ($approvers !== false) {
            http_response_code(200);
            echo json_encode(['approvers' => $approvers]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to fetch approvers']);
        }
    }
}
