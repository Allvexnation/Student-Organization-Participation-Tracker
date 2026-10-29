<?php

require_once __DIR__ . '/../../config/db.php';

class EventTaskModel {
    private $conn;
    private $table_name = "member_tasks";

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
        if (!$this->conn) {
            error_log("Failed to establish database connection in EventTaskModel");
        }
    }

    public function readByStudentId($student_id) {
        if (!$this->conn) {
            error_log("Database connection is null");
            return false;
        }

        require_once __DIR__ . '/../MemberTasksModel.php';
        $memberTasksModel = new MemberTasksModel();
        $memberTasksModel->syncAllTasksStatus();

        $query = "SELECT mt.id, mt.event_id, mt.organization_id, mt.student_id, mt.task_title, mt.task_description, mt.start_date, mt.end_date, mt.student_start_date, mt.student_end_date, mt.status, mt.completed_at, mt.updated_at, mt.created_at,
                         s.first_name, s.last_name, s.student_number,
                         o.name as organization_name,
                         e.title as event_title,
                         ds.id as schedule_id, ds.student_id as schedule_student_id, ds.schedule_date, ds.start_time as schedule_start_time, ds.end_time as schedule_end_time, ds.status as schedule_status
                  FROM " . $this->table_name . " mt
                  LEFT JOIN students s ON mt.student_id = s.id
                  LEFT JOIN organizations o ON mt.organization_id = o.id
                  LEFT JOIN events e ON mt.event_id = e.id
                  LEFT JOIN task_daily_schedules ds ON mt.id = ds.task_id AND (ds.student_id IS NULL OR ds.student_id = mt.student_id)
                  WHERE mt.student_id = :student_id
                  ORDER BY mt.end_date ASC, mt.created_at DESC, ds.schedule_date ASC, ds.start_time ASC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':student_id', $student_id);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $tasks = [];
            foreach ($results as $row) {
                $taskId = $row['id'];
                if (!isset($tasks[$taskId])) {
                    $tasks[$taskId] = [
                        'id' => $row['id'],
                        'event_id' => $row['event_id'],
                        'organization_id' => $row['organization_id'],
                        'student_id' => $row['student_id'],
                        'task_title' => $row['task_title'] ?? null,
                        'task_description' => $row['task_description'],
                        'start_date' => $row['start_date'],
                        'end_date' => $row['end_date'],
                        'student_start_date' => $row['student_start_date'] ?? null,
                        'student_end_date' => $row['student_end_date'] ?? null,
                        'status' => $row['status'],
                        'completed_at' => $row['completed_at'],
                        'updated_at' => $row['updated_at'],
                        'created_at' => $row['created_at'],
                        'first_name' => $row['first_name'],
                        'last_name' => $row['last_name'],
                        'student_number' => $row['student_number'],
                        'organization_name' => $row['organization_name'],
                        'event_title' => $row['event_title'],
                        'student_name' => $row['first_name'] . ' ' . $row['last_name'],
                        'daily_schedules' => []
                    ];
                }
                
                if ($row['schedule_id']) {
                    $tasks[$taskId]['daily_schedules'][] = [
                        'id' => $row['schedule_id'],
                        'task_id' => $taskId,
                        'student_id' => $row['schedule_student_id'] ?? $row['student_id'],
                        'schedule_date' => $row['schedule_date'],
                        'start_time' => $row['schedule_start_time'],
                        'end_time' => $row['schedule_end_time'],
                        'status' => $row['schedule_status'] ?? 'pending'
                    ];
                }
            }

            return array_values($tasks);
        } catch(PDOException $e) {
            error_log("Error reading tasks by student: " . $e->getMessage());
            return false;
        }
    }

    public function readOne($id) {
        require_once __DIR__ . '/../MemberTasksModel.php';
        $memberTasksModel = new MemberTasksModel();
        $memberTasksModel->syncAllTasksStatus();

        $query = "SELECT mt.id, mt.event_id, mt.organization_id, mt.student_id, mt.task_title, mt.task_description, mt.start_date, mt.end_date, mt.student_start_date, mt.student_end_date, mt.status, mt.completed_at, mt.updated_at, mt.created_at,
                         s.first_name, s.last_name, s.student_number,
                         o.name as organization_name,
                         e.title as event_title,
                         ds.id as schedule_id, ds.student_id as schedule_student_id, ds.schedule_date, ds.start_time as schedule_start_time, ds.end_time as schedule_end_time, ds.status as schedule_status
                  FROM " . $this->table_name . " mt
                  LEFT JOIN students s ON mt.student_id = s.id
                  LEFT JOIN organizations o ON mt.organization_id = o.id
                  LEFT JOIN events e ON mt.event_id = e.id
                  LEFT JOIN task_daily_schedules ds ON mt.id = ds.task_id AND (ds.student_id IS NULL OR ds.student_id = mt.student_id)
                  WHERE mt.id = :id 
                  ORDER BY ds.schedule_date ASC, ds.start_time ASC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($results)) {
                return false;
            }

            $task = [
                'id' => $results[0]['id'],
                'event_id' => $results[0]['event_id'],
                'organization_id' => $results[0]['organization_id'],
                'student_id' => $results[0]['student_id'],
                'task_title' => $results[0]['task_title'] ?? null,
                'task_description' => $results[0]['task_description'],
                'start_date' => $results[0]['start_date'],
                'end_date' => $results[0]['end_date'],
                'student_start_date' => $results[0]['student_start_date'] ?? null,
                'student_end_date' => $results[0]['student_end_date'] ?? null,
                'status' => $results[0]['status'],
                'completed_at' => $results[0]['completed_at'],
                'updated_at' => $results[0]['updated_at'],
                'created_at' => $results[0]['created_at'],
                'first_name' => $results[0]['first_name'],
                'last_name' => $results[0]['last_name'],
                'student_number' => $results[0]['student_number'],
                'organization_name' => $results[0]['organization_name'],
                'event_title' => $results[0]['event_title'],
                'student_name' => $results[0]['first_name'] . ' ' . $results[0]['last_name'],
                'daily_schedules' => []
            ];

            foreach ($results as $row) {
                if ($row['schedule_id']) {
                    $task['daily_schedules'][] = [
                        'id' => $row['schedule_id'],
                        'task_id' => $id,
                        'student_id' => $row['schedule_student_id'] ?? $row['student_id'],
                        'schedule_date' => $row['schedule_date'],
                        'start_time' => $row['schedule_start_time'],
                        'end_time' => $row['schedule_end_time'],
                        'status' => $row['schedule_status'] ?? 'pending'
                    ];
                }
            }
            
            return $task;
        } catch(PDOException $e) {
            error_log("Error reading task: " . $e->getMessage());
            return false;
        }
    }

    public function updateStatus($id, $status) {
        $completed_at = null;
        if ($status === 'completed') {
            $completed_at = date('Y-m-d');
        }

        $query = "UPDATE " . $this->table_name . " 
                  SET status = :status,
                      completed_at = :completed_at
                  WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':status', $status);
            $stmt->bindParam(':completed_at', $completed_at);
            $stmt->bindParam(':id', $id);
            
            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error updating task status: " . $e->getMessage());
            return false;
        }
    }
}
