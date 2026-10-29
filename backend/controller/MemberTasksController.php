<?php

require_once __DIR__ . '/../model/MemberTasksModel.php';
require_once __DIR__ . '/../config/jwt.php';

class MemberTasksController {
    private $memberTasksModel;

    public function __construct() {
        $this->memberTasksModel = new MemberTasksModel();
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

        $tasks = $this->memberTasksModel->readAll();

        if ($tasks !== false) {
            http_response_code(200);
            echo json_encode(['tasks' => $tasks]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to fetch tasks']);
        }
    }

    public function getByAdviser() {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $adviserId = JWT::getUserId($token);
        
        $this->memberTasksModel->updateOverdueTasks();
        
        $tasks = $this->memberTasksModel->readByAdviserId($adviserId);

        if ($tasks !== false) {
            http_response_code(200);
            echo json_encode(['tasks' => $tasks]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to fetch tasks']);
        }
    }

    public function getByOrganization($organization_id) {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $this->memberTasksModel->updateOverdueTasks();
        
        $tasks = $this->memberTasksModel->readByOrganizationId($organization_id);

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
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $task = $this->memberTasksModel->readOne($id);

        if ($task) {
            http_response_code(200);
            echo json_encode(['task' => $task]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Task not found']);
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

        if (!isset($data['organization_id']) || !isset($data['student_id']) || !isset($data['task_description']) || !isset($data['start_date']) || !isset($data['end_date'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $data['status'] = isset($data['status']) ? $data['status'] : 'pending';

        $dailySchedules = isset($data['daily_schedules']) ? $data['daily_schedules'] : [];
        unset($data['daily_schedules']);

        $result = $this->memberTasksModel->create($data);

        if ($result) {
            foreach ($dailySchedules as $schedule) {
                $scheduleData = [
                    'task_id' => $result,
                    'schedule_date' => $schedule['date'],
                    'start_time' => $schedule['start_time'],
                    'end_time' => $schedule['end_time']
                ];
                $this->memberTasksModel->createDailySchedule($scheduleData);
            }

            $task = $this->memberTasksModel->readOne($result);
            http_response_code(201);
            echo json_encode(['message' => 'Task created successfully', 'id' => $result, 'task' => $task]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to create task']);
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

        if (!isset($data['organization_id']) || !isset($data['student_id']) || !isset($data['task_description']) || !isset($data['start_date']) || !isset($data['end_date'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $data['completed_at'] = isset($data['completed_at']) ? $data['completed_at'] : null;

        $dailySchedules = isset($data['daily_schedules']) ? $data['daily_schedules'] : [];
        unset($data['daily_schedules']);

        $result = $this->memberTasksModel->update($id, $data);

        if ($result) {
            $this->memberTasksModel->deleteDailySchedulesByTaskId($id);
            
            foreach ($dailySchedules as $schedule) {
                $scheduleData = [
                    'task_id' => $id,
                    'schedule_date' => $schedule['date'],
                    'start_time' => $schedule['start_time'],
                    'end_time' => $schedule['end_time']
                ];
                $this->memberTasksModel->createDailySchedule($scheduleData);
            }

            $task = $this->memberTasksModel->readOne($id);
            http_response_code(200);
            echo json_encode([
                'message' => 'Task updated successfully',
                'task' => $task
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update task']);
        }
    }

    public function updateStatus($id) {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token || !JWT::validate($token)) {
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

        $validStatuses = ['pending', 'completed', 'overdue'];
        if (!in_array($data['status'], $validStatuses)) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid status']);
            return;
        }

        $result = $this->memberTasksModel->updateStatus($id, $data['status']);

        if ($result) {
            $task = $this->memberTasksModel->readOne($id);
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

    public function delete($id) {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $result = $this->memberTasksModel->delete($id);

        if ($result) {
            http_response_code(200);
            echo json_encode(['message' => 'Task deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to delete task']);
        }
    }
}
