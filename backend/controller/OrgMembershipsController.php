<?php

require_once __DIR__ . '/../model/OrgMembershipsModel.php';

class OrgMembershipsController {
    private $model;

    public function __construct() {
        $this->model = new OrgMembershipsModel();
    }

    public function create() {
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['organization_id']) || empty($data['student_id']) || 
            empty($data['date_joined']) || empty($data['role_id']) || 
            empty($data['membership_status'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $result = $this->model->create($data);

        if ($result) {
            http_response_code(201);
            echo json_encode(['message' => 'Organization membership created successfully', 'id' => $result]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to create organization membership']);
        }
    }

    public function readAll() {
        $result = $this->model->readAll();

        if ($result) {
            http_response_code(200);
            echo json_encode(['organization_memberships' => $result]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to fetch organization memberships']);
        }
    }

    public function readOne($id) {
        $result = $this->model->readOne($id);

        if ($result) {
            http_response_code(200);
            echo json_encode(['organization_membership' => $result]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Organization membership not found']);
        }
    }

    public function update($id) {
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['organization_id']) || empty($data['student_id']) || 
            empty($data['date_joined']) || empty($data['role_id']) || 
            empty($data['membership_status'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $result = $this->model->update($id, $data);

        if ($result) {
            http_response_code(200);
            echo json_encode(['message' => 'Organization membership updated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update organization membership']);
        }
    }

    public function delete($id) {
        $result = $this->model->delete($id);

        if ($result) {
            http_response_code(200);
            echo json_encode(['message' => 'Organization membership deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to delete organization membership']);
        }
    }
}
