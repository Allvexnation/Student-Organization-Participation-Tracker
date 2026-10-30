<?php

require_once __DIR__ . '/../../model/MemberTasksModel.php';
require_once __DIR__ . '/../../model/EventOrganizationsModel.php';
require_once __DIR__ . '/../../model/OrganizationMembershipsModel.php';
require_once __DIR__ . '/../../config/jwt.php';

class AdviserEventsController {
    private $memberTasksModel;
    private $eventOrganizationsModel;
    private $organizationMembershipsModel;

    public function __construct() {
        $this->memberTasksModel = new MemberTasksModel();
        $this->eventOrganizationsModel = new EventOrganizationsModel();
        $this->organizationMembershipsModel = new OrganizationMembershipsModel();
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

    private function getAdviserIdFromToken() {
        $token = $this->getBearerToken();
        
        if (!$token || !JWT::validate($token)) {
            return null;
        }

        $payload = JWT::decode($token);
        return isset($payload['user_id']) ? $payload['user_id'] : null;
    }

    public function getRegisteredEvents() {
        header('Content-Type: application/json');
        
        $adviser_id = $this->getAdviserIdFromToken();
        if (!$adviser_id) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $events = $this->eventOrganizationsModel->getRegisteredEventsByAdviserId($adviser_id);

        if ($events !== false) {
            http_response_code(200);
            echo json_encode(['events' => $events]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to fetch registered events']);
        }
    }

    public function getOrganizationsByEvent($event_id) {
        header('Content-Type: application/json');
        
        $adviser_id = $this->getAdviserIdFromToken();
        if (!$adviser_id) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $organizations = $this->eventOrganizationsModel->getOrganizationsByEventId($event_id, $adviser_id);

        if ($organizations !== false) {
            http_response_code(200);
            echo json_encode(['organizations' => $organizations]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to fetch organizations']);
        }
    }

    public function getTasksByEvent($event_id) {
        header('Content-Type: application/json');
        
        $adviser_id = $this->getAdviserIdFromToken();
        if (!$adviser_id) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $tasks = $this->memberTasksModel->readByEventId($event_id);

        if ($tasks !== false) {
            http_response_code(200);
            echo json_encode(['tasks' => $tasks]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to fetch tasks']);
        }
    }

    public function getTasksByOrganization($organization_id) {
        header('Content-Type: application/json');
        
        $adviser_id = $this->getAdviserIdFromToken();
        if (!$adviser_id) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $tasks = $this->memberTasksModel->readByOrganizationId($organization_id);

        if ($tasks !== false) {
            http_response_code(200);
            echo json_encode(['tasks' => $tasks]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to fetch tasks']);
        }
    }

    public function getAllTasks() {
        header('Content-Type: application/json');
        
        $adviser_id = $this->getAdviserIdFromToken();
        if (!$adviser_id) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $tasks = $this->memberTasksModel->readByAdviserId($adviser_id);

        if ($tasks !== false) {
            http_response_code(200);
            echo json_encode(['tasks' => $tasks]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to fetch tasks']);
        }
    }

    public function getTask($id) {
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

    public function createTask() {
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

        if (!isset($data['event_id']) || !isset($data['organization_id']) || !isset($data['student_id']) || !isset($data['task_description']) || !isset($data['start_date']) || !isset($data['end_date'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        if (!isset($data['task_title'])) {
            $data['task_title'] = null;
        }

        $data['status'] = 'pending';
        $data['completed_at'] = null;
        $data['student_start_date'] = isset($data['student_start_date']) ? $data['student_start_date'] : $data['start_date'];
        $data['student_end_date'] = isset($data['student_end_date']) ? $data['student_end_date'] : $data['end_date'];

        $existing = $this->memberTasksModel->findTaskForStudent(
            $data['event_id'],
            $data['organization_id'],
            $data['student_id'],
            $data['task_title'],
            $data['task_description']
        );

        if ($existing) {
            $task_id = $existing['id'];
            $this->memberTasksModel->update($task_id, $data);
            $this->memberTasksModel->deleteDailySchedulesByTaskId($task_id);
        } else {
            $task_id = $this->memberTasksModel->create($data);
        }

        if ($task_id) {
            if (isset($data['daily_schedules']) && is_array($data['daily_schedules'])) {
                foreach ($data['daily_schedules'] as $schedule) {
                    $scheduleData = [
                        'task_id' => $task_id,
                        'student_id' => $data['student_id'],
                        'schedule_date' => $schedule['date'] ?? null,
                        'start_time' => $schedule['start_time'] ?? null,
                        'end_time' => $schedule['end_time'] ?? null,
                        'status' => isset($schedule['status']) ? $schedule['status'] : 'pending'
                    ];
                    $this->memberTasksModel->createDailySchedule($scheduleData);
                }
            }

            http_response_code(201);
            echo json_encode(['message' => 'Task created successfully', 'id' => $task_id]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to create task']);
        }
    }

    public function updateTask($id) {
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

        if (!isset($data['event_id']) || !isset($data['organization_id']) || !isset($data['student_id']) || !isset($data['task_description']) || !isset($data['start_date']) || !isset($data['end_date'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        if (!isset($data['task_title'])) {
            $data['task_title'] = null;
        }
        $data['status'] = isset($data['status']) ? $data['status'] : 'pending';
        $data['completed_at'] = isset($data['status']) && $data['status'] === 'completed' ? date('Y-m-d') : null;
        $data['student_start_date'] = isset($data['student_start_date']) ? $data['student_start_date'] : $data['start_date'];
        $data['student_end_date'] = isset($data['student_end_date']) ? $data['student_end_date'] : $data['end_date'];

        $result = $this->memberTasksModel->update($id, $data);

        if ($result) {
            if (isset($data['daily_schedules']) && is_array($data['daily_schedules'])) {
                $this->memberTasksModel->deleteDailySchedulesByTaskId($id);
                foreach ($data['daily_schedules'] as $schedule) {
                    $scheduleData = [
                        'task_id' => $id,
                        'student_id' => $data['student_id'],
                        'schedule_date' => $schedule['date'] ?? null,
                        'start_time' => $schedule['start_time'] ?? null,
                        'end_time' => $schedule['end_time'] ?? null,
                        'status' => isset($schedule['status']) ? $schedule['status'] : 'pending'
                    ];
                    $this->memberTasksModel->createDailySchedule($scheduleData);
                }
            }

            $task = $this->memberTasksModel->readOne($id);
            http_response_code(200);
            echo json_encode(['message' => 'Task updated successfully', 'task' => $task]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update task']);
        }
    }

    public function updateTaskStatus($id) {
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
            echo json_encode(['message' => 'Invalid data']);
            return;
        }

        $result = $this->memberTasksModel->updateStatus($id, $data['status']);

        if ($result) {
            http_response_code(200);
            echo json_encode(['message' => 'Task status updated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update task status']);
        }
    }

    public function deleteTask($id) {
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

    public function updateScheduleStatus($schedule_id) {
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
            echo json_encode(['message' => 'Invalid data']);
            return;
        }

        $validStatuses = ['pending', 'completed', 'not_completed', 'not_finished'];
        if (!in_array($data['status'], $validStatuses)) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid status']);
            return;
        }

        $result = $this->memberTasksModel->updateScheduleStatus($schedule_id, $data['status']);

        if ($result) {
            http_response_code(200);
            echo json_encode(['message' => 'Schedule status updated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update schedule status']);
        }
    }

    public function syncTaskGroup() {
        header('Content-Type: application/json');
        
        $adviser_id = $this->getAdviserIdFromToken();
        if (!$adviser_id) {
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

        if (empty($data['event_id']) || empty($data['organization_id']) || empty($data['task_description']) || empty($data['start_date']) || empty($data['end_date'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        if (empty($data['students']) || !is_array($data['students'])) {
            http_response_code(400);
            echo json_encode(['message' => 'At least one student must be assigned']);
            return;
        }

        $eventId = intval($data['event_id']);
        $orgId = intval($data['organization_id']);
        $taskTitle = !empty($data['task_title']) ? trim($data['task_title']) : null;
        $taskDescription = trim($data['task_description']);
        $startDate = $data['start_date'];
        $endDate = $data['end_date'];

        $uniqueStudents = [];
        $seenStudentIds = [];
        foreach ($data['students'] as $st) {
            $sId = intval($st['student_id'] ?? 0);
            if ($sId > 0 && !in_array($sId, $seenStudentIds)) {
                $seenStudentIds[] = $sId;
                $uniqueStudents[] = $st;
            }
        }

        if (empty($uniqueStudents)) {
            http_response_code(400);
            echo json_encode(['message' => 'No valid students provided']);
            return;
        }

        $taskIds = !empty($data['task_ids']) && is_array($data['task_ids']) 
            ? array_map('intval', $data['task_ids']) 
            : [];

        $matchingTasks = $this->memberTasksModel->findTasksForGroup($eventId, $orgId, $taskTitle, $taskDescription);
        foreach ($matchingTasks as $mt) {
            $mtId = intval($mt['id']);
            if (!in_array($mtId, $taskIds)) {
                $taskIds[] = $mtId;
            }
        }

        $existingTasks = [];
        if (!empty($taskIds)) {
            $existingTasks = $this->memberTasksModel->readByIds($taskIds);
        }

        $existingByStudent = [];
        $unassignedTaskIds = [];

        foreach ($existingTasks as $ext) {
            $sId = intval($ext['student_id']);
            if (!isset($existingByStudent[$sId])) {
                $existingByStudent[$sId] = $ext;
            } else {
                $unassignedTaskIds[] = intval($ext['id']);
            }
        }

        foreach ($uniqueStudents as $studentData) {
            $sId = intval($studentData['student_id']);
            $studentStartDate = !empty($studentData['student_start_date']) ? $studentData['student_start_date'] : $startDate;
            $studentEndDate = !empty($studentData['student_end_date']) ? $studentData['student_end_date'] : $endDate;
            $dailySchedules = !empty($studentData['daily_schedules']) && is_array($studentData['daily_schedules']) 
                ? $studentData['daily_schedules'] 
                : [];

            if (isset($existingByStudent[$sId])) {
                $taskId = intval($existingByStudent[$sId]['id']);
                $updateData = [
                    'event_id' => $eventId,
                    'organization_id' => $orgId,
                    'student_id' => $sId,
                    'task_title' => $taskTitle,
                    'task_description' => $taskDescription,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'student_start_date' => $studentStartDate,
                    'student_end_date' => $studentEndDate,
                    'status' => $existingByStudent[$sId]['status'] ?? 'pending',
                    'completed_at' => $existingByStudent[$sId]['completed_at'] ?? null
                ];
                $this->memberTasksModel->update($taskId, $updateData);
                $this->memberTasksModel->deleteDailySchedulesByTaskId($taskId);
                foreach ($dailySchedules as $sch) {
                    $this->memberTasksModel->createDailySchedule([
                        'task_id' => $taskId,
                        'student_id' => $sId,
                        'schedule_date' => $sch['date'] ?? null,
                        'start_time' => $sch['start_time'] ?? null,
                        'end_time' => $sch['end_time'] ?? null,
                        'status' => $sch['status'] ?? 'pending'
                    ]);
                }

                unset($existingByStudent[$sId]);
            } else {
                $reusedTaskId = null;
                if (!empty($unassignedTaskIds)) {
                    $reusedTaskId = array_shift($unassignedTaskIds);
                } elseif (!empty($existingByStudent)) {
                    $firstUnassigned = array_shift($existingByStudent);
                    $reusedTaskId = intval($firstUnassigned['id']);
                }

                if ($reusedTaskId) {
                    $updateData = [
                        'event_id' => $eventId,
                        'organization_id' => $orgId,
                        'student_id' => $sId,
                        'task_title' => $taskTitle,
                        'task_description' => $taskDescription,
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                        'student_start_date' => $studentStartDate,
                        'student_end_date' => $studentEndDate,
                        'status' => 'pending',
                        'completed_at' => null
                    ];
                    $this->memberTasksModel->update($reusedTaskId, $updateData);

                    $this->memberTasksModel->deleteDailySchedulesByTaskId($reusedTaskId);
                    foreach ($dailySchedules as $sch) {
                        $this->memberTasksModel->createDailySchedule([
                            'task_id' => $reusedTaskId,
                            'student_id' => $sId,
                            'schedule_date' => $sch['date'] ?? null,
                            'start_time' => $sch['start_time'] ?? null,
                            'end_time' => $sch['end_time'] ?? null,
                            'status' => $sch['status'] ?? 'pending'
                        ]);
                    }
                } else {
                    $createData = [
                        'event_id' => $eventId,
                        'organization_id' => $orgId,
                        'student_id' => $sId,
                        'task_title' => $taskTitle,
                        'task_description' => $taskDescription,
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                        'student_start_date' => $studentStartDate,
                        'student_end_date' => $studentEndDate,
                        'status' => 'pending'
                    ];
                    $newTaskId = $this->memberTasksModel->create($createData);
                    if ($newTaskId) {
                        foreach ($dailySchedules as $sch) {
                            $this->memberTasksModel->createDailySchedule([
                                'task_id' => $newTaskId,
                                'student_id' => $sId,
                                'schedule_date' => $sch['date'] ?? null,
                                'start_time' => $sch['start_time'] ?? null,
                                'end_time' => $sch['end_time'] ?? null,
                                'status' => $sch['status'] ?? 'pending'
                            ]);
                        }
                    }
                }
            }
        }

        $tasksToDelete = array_merge($unassignedTaskIds, array_column(array_values($existingByStudent), 'id'));
        foreach ($tasksToDelete as $delId) {
            $delId = intval($delId);
            $this->memberTasksModel->deleteDailySchedulesByTaskId($delId);
            $this->memberTasksModel->delete($delId);
        }

        http_response_code(200);
        echo json_encode(['message' => 'Task group saved successfully']);
    }

    public function deleteTaskGroup() {
        header('Content-Type: application/json');
        
        $adviser_id = $this->getAdviserIdFromToken();
        if (!$adviser_id) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || empty($data['task_ids']) || !is_array($data['task_ids'])) {
            http_response_code(400);
            echo json_encode(['message' => 'task_ids array is required']);
            return;
        }

        foreach ($data['task_ids'] as $id) {
            $taskId = intval($id);
            $this->memberTasksModel->deleteDailySchedulesByTaskId($taskId);
            $this->memberTasksModel->delete($taskId);
        }

        http_response_code(200);
        echo json_encode(['message' => 'Task group deleted successfully']);
    }
}
