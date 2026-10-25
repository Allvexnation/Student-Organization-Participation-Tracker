<?php

require_once __DIR__ . '/../model/RoleModel.php';
require_once __DIR__ . '/../config/jwt.php';

class RoleController {
    private $roleModel;

    public function __construct() {
        $this->roleModel = new RoleModel();
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

        $roles = $this->roleModel->readAll();

        if ($roles !== false) {
            http_response_code(200);
            echo json_encode(['roles' => $roles]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to fetch roles']);
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

        $role = $this->roleModel->readOne($id);

        if ($role) {
            http_response_code(200);
            echo json_encode(['role' => $role]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Role not found']);
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

        if (!isset($data['role_name'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required field: role_name']);
            return;
        }

        $result = $this->roleModel->create($data);

        if ($result) {
            http_response_code(201);
            echo json_encode(['message' => 'Role created successfully', 'id' => $result]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to create role']);
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

        if (!isset($data['role_name'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required field: role_name']);
            return;
        }

        $result = $this->roleModel->update($id, $data);

        if ($result) {
            $role = $this->roleModel->readOne($id);
            http_response_code(200);
            echo json_encode([
                'message' => 'Role updated successfully',
                'role' => $role
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update role']);
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

        $result = $this->roleModel->delete($id);

        if ($result) {
            http_response_code(200);
            echo json_encode(['message' => 'Role deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to delete role']);
        }
    }
}
