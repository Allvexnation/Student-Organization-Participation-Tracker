<?php

require_once __DIR__ . '/../../model/Students/EventTaskModel.php';
require_once __DIR__ . '/../../model/SessionModel.php';
require_once __DIR__ . '/../../config/jwt.php';

class EventTaskController {
    private $eventTaskModel;
    private $sessionModel;

    public function __construct() {
        $this->eventTaskModel = new EventTaskModel();
        $this->sessionModel = new SessionModel();
    }

    private function validateToken($token) {
        if (!$token || !JWT::validate($token)) {
            return false;
        }

        $session = $this->sessionModel->validateToken($token);
        if (!$session) {
            return false;
        }

        $payload = JWT::getPayload($token);
        if ($payload['role'] !== 'student') {
            return false;
        }

        return $payload['user_id'];
    }

    public function getAll() {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        $studentId = $this->validateToken($token);
        
        if (!$studentId) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }
        
        $tasks = $this->eventTaskModel->readByStudentId($studentId);

        if ($tasks !== false) {
            http_response_code(200);
            echo json_encode(['tasks' => $tasks]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to fetch tasks']);
        }
    }

    public function getOne($id) {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        $studentId = $this->validateToken($token);
        
        if (!$studentId) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $task = $this->eventTaskModel->readOne($id);

        if ($task) {
            http_response_code(200);
            echo json_encode(['task' => $task]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Task not found']);
        }
    }

    public function updateStatus($id) {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        $studentId = $this->validateToken($token);
        
        if (!$studentId) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['status'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Status is required']);
            return;
        }

        $validStatuses = ['pending', 'completed', 'overdue', 'not_completed', 'not_finished'];
        if (!in_array($data['status'], $validStatuses)) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid status']);
            return;
        }

        $result = $this->eventTaskModel->updateStatus($id, $data['status']);

        if ($result) {
            $task = $this->eventTaskModel->readOne($id);
            http_response_code(200);
            echo json_encode([
                'message' => 'Task status updated successfully',
                'task' => $task
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update task status']);
        }
    }

    public function updateScheduleStatus($schedule_id) {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        $studentId = $this->validateToken($token);
        
        if (!$studentId) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data || !isset($data['status'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid data']);
            return;
        }

        $validStatuses = ['pending', 'completed', 'not_completed', 'not_finished'];
        if (!in_array($data['status'], $validStatuses)) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid status']);
            return;
        }

        require_once __DIR__ . '/../../model/MemberTasksModel.php';
        $memberTasksModel = new MemberTasksModel();
        $result = $memberTasksModel->updateScheduleStatus($schedule_id, $data['status']);

        if ($result) {
            http_response_code(200);
            echo json_encode(['message' => 'Schedule status updated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update schedule status']);
        }
    }
}
