<?php

require_once __DIR__ . '/../model/StudentsModel.php';
require_once __DIR__ . '/../config/jwt.php';

class StudentsController {
    private $studentsModel;

    public function __construct() {
        $this->studentsModel = new StudentsModel();
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

        $students = $this->studentsModel->readAll();

        if ($students !== false) {
            http_response_code(200);
            echo json_encode(['students' => $students]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to fetch students']);
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

        $student = $this->studentsModel->readOne($id);

        if ($student) {
            http_response_code(200);
            echo json_encode(['student' => $student]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Student not found']);
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

        if (!isset($data['student_number']) || !isset($data['first_name']) || !isset($data['last_name']) || !isset($data['program']) || !isset($data['year_level']) || !isset($data['username']) || !isset($data['email']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $result = $this->studentsModel->create($data);

        if ($result) {
            http_response_code(201);
            echo json_encode(['message' => 'Student created successfully', 'id' => $result]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to create student']);
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

        if (!isset($data['student_number']) || !isset($data['first_name']) || !isset($data['last_name']) || !isset($data['program']) || !isset($data['year_level']) || !isset($data['username']) || !isset($data['email'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $result = $this->studentsModel->update($id, $data);

        if ($result) {
            $student = $this->studentsModel->readOne($id);
            http_response_code(200);
            echo json_encode([
                'message' => 'Student updated successfully',
                'student' => $student
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update student']);
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

        $result = $this->studentsModel->delete($id);

        if ($result) {
            http_response_code(200);
            echo json_encode(['message' => 'Student deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to delete student']);
        }
    }
}
