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
            if (intval($task['student_id']) !== intval($studentId)) {
                http_response_code(403);
                echo json_encode(['message' => 'Forbidden']);
                return;
            }
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

        $validStatuses = ['completed', 'not_completed'];
        if (!in_array($data['status'], $validStatuses)) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid status. Students can mark tasks as completed or not_completed.']);
            return;
        }

        $task = $this->eventTaskModel->readOne($id);
        if (!$task) {
            http_response_code(404);
            echo json_encode(['message' => 'Task not found']);
            return;
        }

        if (intval($task['student_id']) !== intval($studentId)) {
            http_response_code(403);
            echo json_encode(['message' => 'Forbidden: Task does not belong to you']);
            return;
        }

        $endDate = !empty($task['student_end_date']) ? $task['student_end_date'] : $task['end_date'];
        $today = date('Y-m-d');
        if ($endDate < $today) {
            http_response_code(400);
            echo json_encode(['message' => 'The time for this task has ended. It is automatically marked as not finished.']);
            return;
        }

        $result = $this->eventTaskModel->updateStatus($id, $data['status'], 'student');

        if ($result) {
            $updated = $this->eventTaskModel->readOne($id);
            http_response_code(200);
            echo json_encode([
                'message' => 'Task marked successfully',
                'task' => $updated
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

        $validStatuses = ['completed', 'not_completed', 'pending'];
        if (!in_array($data['status'], $validStatuses)) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid status. Students can mark schedules as completed, not_completed, or pending.']);
            return;
        }

        require_once __DIR__ . '/../../model/MemberTasksModel.php';
        $memberTasksModel = new MemberTasksModel();

        $database = Database::getInstance();
        $conn = $database->getConnection();
        $schStmt = $conn->prepare("SELECT ds.id, ds.task_id, ds.student_id, ds.schedule_date, ds.end_time, mt.student_id as task_student_id
                                   FROM task_daily_schedules ds
                                   JOIN member_tasks mt ON ds.task_id = mt.id
                                   WHERE ds.id = :id");
        $schStmt->bindParam(':id', $schedule_id);
        $schStmt->execute();
        $sch = $schStmt->fetch(PDO::FETCH_ASSOC);

        if (!$sch) {
            http_response_code(404);
            echo json_encode(['message' => 'Schedule not found']);
            return;
        }

        $assignedStudent = $sch['student_id'] ? $sch['student_id'] : $sch['task_student_id'];
        if (intval($assignedStudent) !== intval($studentId)) {
            http_response_code(403);
            echo json_encode(['message' => 'Forbidden: Schedule does not belong to you']);
            return;
        }

        $today = date('Y-m-d');
        $nowTime = date('H:i:s');
        $isPastTime = ($sch['schedule_date'] < $today) || ($sch['schedule_date'] === $today && $nowTime > $sch['end_time']);
        if ($isPastTime) {
            http_response_code(400);
            echo json_encode(['message' => 'The time for this schedule has ended. It is automatically marked as not finished.']);
            return;
        }

        $result = $memberTasksModel->updateScheduleStatus($schedule_id, $data['status'], 'student');

        if ($result) {
            http_response_code(200);
            echo json_encode(['message' => 'Schedule status updated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update schedule status']);
        }
    }
}
