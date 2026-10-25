<?php

require_once __DIR__ . '/../model/OrganizationsModel.php';
require_once __DIR__ . '/../config/jwt.php';

class OrganizationsController {
    private $organizationsModel;

    public function __construct() {
        $this->organizationsModel = new OrganizationsModel();
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

        $organizations = $this->organizationsModel->readAll();

        if ($organizations !== false) {
            http_response_code(200);
            echo json_encode(['organizations' => $organizations]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to fetch organizations']);
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

        $organization = $this->organizationsModel->readOne($id);

        if ($organization) {
            http_response_code(200);
            echo json_encode(['organization' => $organization]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Organization not found']);
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

        if (!isset($data['org_code']) || !isset($data['name']) || !isset($data['status'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $result = $this->organizationsModel->create($data);

        if ($result) {
            http_response_code(201);
            echo json_encode(['message' => 'Organization created successfully', 'id' => $result]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to create organization']);
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

        if (!isset($data['org_code']) || !isset($data['name']) || !isset($data['status'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $result = $this->organizationsModel->update($id, $data);

        if ($result) {
            $organization = $this->organizationsModel->readOne($id);
            http_response_code(200);
            echo json_encode([
                'message' => 'Organization updated successfully',
                'organization' => $organization
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update organization']);
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

        $result = $this->organizationsModel->delete($id);

        if ($result) {
            http_response_code(200);
            echo json_encode(['message' => 'Organization deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to delete organization']);
        }
    }
}
