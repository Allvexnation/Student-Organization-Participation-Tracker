<?php

require_once __DIR__ . '/../model/AdviserModel.php';
require_once __DIR__ . '/../config/jwt.php';

class AdviserController {
    private $adviserModel;

    public function __construct() {
        $this->adviserModel = new AdviserModel();
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

        $advisers = $this->adviserModel->readAll();

        if ($advisers !== false) {
            http_response_code(200);
            echo json_encode(['advisers' => $advisers]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to fetch advisers']);
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

        $adviser = $this->adviserModel->readOne($id);

        if ($adviser) {
            http_response_code(200);
            echo json_encode(['adviser' => $adviser]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Adviser not found']);
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

        if (!isset($data['name']) || !isset($data['username']) || !isset($data['email']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $result = $this->adviserModel->create($data);

        if ($result) {
            http_response_code(201);
            echo json_encode(['message' => 'Adviser created successfully', 'id' => $result]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to create adviser']);
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

        if (!isset($data['name']) || !isset($data['username']) || !isset($data['email'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $result = $this->adviserModel->update($id, $data);

        if ($result) {
            $adviser = $this->adviserModel->readOne($id);
            http_response_code(200);
            echo json_encode([
                'message' => 'Adviser updated successfully',
                'adviser' => $adviser
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update adviser']);
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

        $result = $this->adviserModel->delete($id);

        if ($result) {
            http_response_code(200);
            echo json_encode(['message' => 'Adviser deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to delete adviser']);
        }
    }
}
