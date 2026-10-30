<?php

require_once __DIR__ . '/../model/OrganizationMembershipsModel.php';
require_once __DIR__ . '/../config/jwt.php';

class OrganizationMembershipsController {
    private $orgMembershipsModel;

    public function __construct() {
        $this->orgMembershipsModel = new OrganizationMembershipsModel();
    }

    private function getBearerToken() {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        if (!empty($headers)) {
            foreach ($headers as $key => $value) {
                if (strtolower($key) === 'authorization') {
                    $token = trim(str_ireplace('Bearer ', '', $value));
                    if (!empty($token) && $token !== 'null' && $token !== 'undefined') {
                        return $token;
                    }
                }
            }
        }
        
        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            $token = trim(str_ireplace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION']));
            if (!empty($token) && $token !== 'null' && $token !== 'undefined') {
                return $token;
            }
        }
        
        if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $token = trim(str_ireplace('Bearer ', '', $_SERVER['REDIRECT_HTTP_AUTHORIZATION']));
            if (!empty($token) && $token !== 'null' && $token !== 'undefined') {
                return $token;
            }
        }
        
        return null;
    }

    public function getAll() {
        header('Content-Type: application/json');
        
        $token = $this->getBearerToken();
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $orgMemberships = $this->orgMembershipsModel->readAll();

        if ($orgMemberships !== false) {
            http_response_code(200);
            echo json_encode(['organization_memberships' => $orgMemberships]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to fetch organization memberships']);
        }
    }

    public function getOne($id) {
        header('Content-Type: application/json');
        
        $token = $this->getBearerToken();
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $orgMembership = $this->orgMembershipsModel->readOne($id);

        if ($orgMembership) {
            http_response_code(200);
            echo json_encode(['organization_membership' => $orgMembership]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Organization membership not found']);
        }
    }

    public function create() {
        header('Content-Type: application/json');
        
        $token = $this->getBearerToken();
        
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

        if (!isset($data['organization_id']) || !isset($data['student_id']) || !isset($data['date_joined']) || !isset($data['role_id']) || !isset($data['membership_status'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $result = $this->orgMembershipsModel->create($data);

        if ($result) {
            http_response_code(201);
            echo json_encode(['message' => 'Organization membership created successfully', 'id' => $result]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to create organization membership']);
        }
    }

    public function update($id) {
        header('Content-Type: application/json');
        
        $token = $this->getBearerToken();
        
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

        if (!isset($data['organization_id']) || !isset($data['student_id']) || !isset($data['date_joined']) || !isset($data['role_id']) || !isset($data['membership_status'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $result = $this->orgMembershipsModel->update($id, $data);

        if ($result) {
            $orgMembership = $this->orgMembershipsModel->readOne($id);
            http_response_code(200);
            echo json_encode([
                'message' => 'Organization membership updated successfully',
                'organization_membership' => $orgMembership
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update organization membership']);
        }
    }

    public function delete($id) {
        header('Content-Type: application/json');
        
        $token = $this->getBearerToken();
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $result = $this->orgMembershipsModel->delete($id);

        if ($result) {
            http_response_code(200);
            echo json_encode(['message' => 'Organization membership deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to delete organization membership']);
        }
    }
}
