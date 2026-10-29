<?php

require_once __DIR__ . '/../config/db.php';

class MemberTasksModel {
    private $conn;
    private $table_name = "member_tasks";

    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
        if (!$this->conn) {
            error_log("Failed to establish database connection in MemberTasksModel");
        } else {
            try {
                $this->conn->exec("ALTER TABLE member_tasks MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending'");
                $this->conn->exec("ALTER TABLE task_daily_schedules MODIFY COLUMN status VARCHAR(50) DEFAULT 'pending'");
            } catch (Exception $e) {

            }
        }
    }

    public function create($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (event_id, organization_id, student_id, task_title, task_description, start_date, end_date, student_start_date, student_end_date, status) 
                  VALUES (:event_id, :organization_id, :student_id, :task_title, :task_description, :start_date, :end_date, :student_start_date, :student_end_date, :status)";

        try {
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':event_id', $data['event_id']);
            $stmt->bindParam(':organization_id', $data['organization_id']);
            $stmt->bindParam(':student_id', $data['student_id']);
            $stmt->bindParam(':task_title', $data['task_title']);
            $stmt->bindParam(':task_description', $data['task_description']);
            $stmt->bindParam(':start_date', $data['start_date']);
            $stmt->bindParam(':end_date', $data['end_date']);
            $stmt->bindParam(':student_start_date', $data['student_start_date']);
            $stmt->bindParam(':student_end_date', $data['student_end_date']);
            $stmt->bindParam(':status', $data['status']);
            
            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error creating member task: " . $e->getMessage());
            return false;
        }
    }

    public function readAll() {
        if (!$this->conn) {
            error_log("Database connection is null");
            return false;
        }

        $this->syncAllTasksStatus();

        $query = "SELECT mt.id, mt.event_id, mt.organization_id, mt.student_id, mt.task_title, mt.task_description, mt.start_date, mt.end_date, mt.status, mt.completed_at, mt.updated_at, mt.created_at,
                         s.first_name, s.last_name, s.student_number,
                         o.name as organization_name,
                         e.title as event_title
                  FROM " . $this->table_name . " mt
                  LEFT JOIN students s ON mt.student_id = s.id
                  LEFT JOIN organizations o ON mt.organization_id = o.id
                  LEFT JOIN events e ON mt.event_id = e.id
                  ORDER BY mt.end_date ASC, mt.created_at DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($results as &$task) {
                $task['student_name'] = $task['first_name'] . ' ' . $task['last_name'];
            }

            return $results;
        } catch(PDOException $e) {
            error_log("Error reading member tasks: " . $e->getMessage());
            return false;
        }
    }

    public function readByAdviserId($adviser_id) {
        if (!$this->conn) {
            error_log("Database connection is null");
            return false;
        }

        $query = "SELECT mt.id, mt.event_id, mt.organization_id, mt.student_id, mt.task_title, mt.task_description, mt.start_date, mt.end_date, mt.status, mt.completed_at, mt.updated_at, mt.created_at,
                         s.first_name, s.last_name, s.student_number,
                         o.name as organization_name,
                         e.title as event_title
                  FROM " . $this->table_name . " mt
                  LEFT JOIN students s ON mt.student_id = s.id
                  LEFT JOIN organizations o ON mt.organization_id = o.id
                  LEFT JOIN events e ON mt.event_id = e.id
                  WHERE o.adviser_id = :adviser_id
                  ORDER BY mt.end_date ASC, mt.created_at DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':adviser_id', $adviser_id);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($results as &$task) {
                $task['student_name'] = $task['first_name'] . ' ' . $task['last_name'];
            }

            return $results;
        } catch(PDOException $e) {
            error_log("Error reading member tasks by adviser: " . $e->getMessage());
            return false;
        }
    }

    public function readByEventId($event_id) {
        if (!$this->conn) {
            error_log("Database connection is null");
            return false;
        }

        $this->cleanupDuplicatesByEvent($event_id);
        $this->syncAllTasksStatus();

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
                  WHERE mt.event_id = :event_id
                  ORDER BY mt.end_date ASC, mt.created_at DESC, ds.schedule_date ASC, ds.start_time ASC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':event_id', $event_id);
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
            error_log("Error reading member tasks by event: " . $e->getMessage());
            return false;
        }
    }

    public function readByOrganizationId($organization_id) {
        if (!$this->conn) {
            error_log("Database connection is null");
            return false;
        }

        $this->cleanupDuplicatesByOrganization($organization_id);
        $this->syncAllTasksStatus();

        $query = "SELECT mt.id, mt.event_id, mt.organization_id, mt.student_id, mt.task_title, mt.task_description, mt.start_date, mt.end_date, mt.student_start_date, mt.student_end_date, mt.status, mt.completed_at, mt.updated_at, mt.created_at,
                         s.first_name, s.last_name, s.student_number,
                         o.name as organization_name,
                         e.title as event_title,
                         ds.id as schedule_id, ds.student_id as schedule_student_id, ds.schedule_date, ds.start_time as schedule_start_time, ds.end_time as schedule_end_time, ds.status as schedule_status
                  FROM " . $this->table_name . " mt
                  LEFT JOIN students s ON mt.student_id = s.id
                  LEFT JOIN organizations o ON mt.organization_id = o.id
                  LEFT JOIN events e ON mt.event_id = e.id
                  LEFT JOIN task_daily_schedules ds ON mt.id = ds.task_id
                  WHERE mt.organization_id = :organization_id
                  ORDER BY mt.end_date ASC, mt.created_at DESC, ds.schedule_date ASC, ds.start_time ASC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':organization_id', $organization_id);
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
            error_log("Error reading member tasks by organization: " . $e->getMessage());
            return false;
        }
    }

    public function readOne($id) {
        $query = "SELECT mt.id, mt.event_id, mt.organization_id, mt.student_id, mt.task_title, mt.task_description, mt.start_date, mt.end_date, mt.student_start_date, mt.student_end_date, mt.status, mt.completed_at, mt.updated_at, mt.created_at,
                         s.first_name, s.last_name, s.student_number,
                         o.name as organization_name,
                         e.title as event_title,
                         ds.id as schedule_id, ds.student_id as schedule_student_id, ds.schedule_date, ds.start_time as schedule_start_time, ds.end_time as schedule_end_time, ds.status as schedule_status
                  FROM " . $this->table_name . " mt
                  LEFT JOIN students s ON mt.student_id = s.id
                  LEFT JOIN organizations o ON mt.organization_id = o.id
                  LEFT JOIN events e ON mt.event_id = e.id
                  LEFT JOIN task_daily_schedules ds ON mt.id = ds.task_id
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
                        'schedule_date' => $row['schedule_date'],
                        'start_time' => $row['schedule_start_time'],
                        'end_time' => $row['schedule_end_time'],
                        'status' => $row['schedule_status'] ?? 'pending'
                    ];
                }
            }
            
            return $task;
        } catch(PDOException $e) {
            error_log("Error reading member task: " . $e->getMessage());
            return false;
        }
    }

    public function update($id, $data) {
        $query = "UPDATE " . $this->table_name . " 
                  SET event_id = :event_id, 
                      organization_id = :organization_id, 
                      student_id = :student_id, 
                      task_title = :task_title,
                      task_description = :task_description, 
                      start_date = :start_date, 
                      end_date = :end_date,
                      student_start_date = :student_start_date,
                      student_end_date = :student_end_date,
                      status = :status,
                      completed_at = :completed_at
                  WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':event_id', $data['event_id']);
            $stmt->bindParam(':organization_id', $data['organization_id']);
            $stmt->bindParam(':student_id', $data['student_id']);
            $stmt->bindParam(':task_title', $data['task_title']);
            $stmt->bindParam(':task_description', $data['task_description']);
            $stmt->bindParam(':start_date', $data['start_date']);
            $stmt->bindParam(':end_date', $data['end_date']);
            $stmt->bindParam(':student_start_date', $data['student_start_date']);
            $stmt->bindParam(':student_end_date', $data['student_end_date']);
            $stmt->bindParam(':status', $data['status']);
            $stmt->bindParam(':completed_at', $data['completed_at']);
            
            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error updating member task: " . $e->getMessage());
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
            error_log("Error updating member task status: " . $e->getMessage());
            return false;
        }
    }

    public function delete($id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            
            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error deleting member task: " . $e->getMessage());
            return false;
        }
    }

    public function updateOverdueTasks() {
        $query = "UPDATE " . $this->table_name . " 
                  SET status = 'overdue'
                  WHERE status = 'pending' 
                  AND end_date < CURDATE()";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return $stmt->rowCount();
        } catch(PDOException $e) {
            error_log("Error updating overdue tasks: " . $e->getMessage());
            return false;
        }
    }

    public function getDailySchedulesByTaskId($task_id) {
        if (!$this->conn) {
            error_log("Database connection is null");
            return [];
        }

        $query = "SELECT id, task_id, student_id, schedule_date, start_time, end_time, status, updated_at, created_at
                  FROM task_daily_schedules
                  WHERE task_id = :task_id
                  ORDER BY schedule_date ASC, start_time ASC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':task_id', $task_id);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            error_log("Error reading daily schedules: " . $e->getMessage());
            return [];
        }
    }

    public function createDailySchedule($data) {
        $query = "INSERT INTO task_daily_schedules
                  (task_id, student_id, schedule_date, start_time, end_time, status)
                  VALUES (:task_id, :student_id, :schedule_date, :start_time, :end_time, :status)";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':task_id', $data['task_id']);
            $stmt->bindParam(':student_id', $data['student_id']);
            $stmt->bindParam(':schedule_date', $data['schedule_date']);
            $stmt->bindParam(':start_time', $data['start_time']);
            $stmt->bindParam(':end_time', $data['end_time']);
            $stmt->bindParam(':status', $data['status']);

            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error creating daily schedule: " . $e->getMessage());
            return false;
        }
    }

    public function updateDailySchedule($id, $data) {
        $query = "UPDATE task_daily_schedules
                  SET schedule_date = :schedule_date,
                      start_time = :start_time,
                      end_time = :end_time,
                      status = :status
                  WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':schedule_date', $data['schedule_date']);
            $stmt->bindParam(':start_time', $data['start_time']);
            $stmt->bindParam(':end_time', $data['end_time']);
            $stmt->bindParam(':status', $data['status']);
            $stmt->bindParam(':id', $id);

            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error updating daily schedule: " . $e->getMessage());
            return false;
        }
    }

    public function deleteDailySchedule($id) {
        $query = "DELETE FROM task_daily_schedules WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);

            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error deleting daily schedule: " . $e->getMessage());
            return false;
        }
    }

    public function deleteDailySchedulesByTaskId($task_id) {
        $query = "DELETE FROM task_daily_schedules WHERE task_id = :task_id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':task_id', $task_id);

            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error deleting daily schedules by task: " . $e->getMessage());
            return false;
        }
    }

    public function updateScheduleStatus($id, $status) {
        $query = "UPDATE task_daily_schedules
                  SET status = :status
                  WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':status', $status);
            $stmt->bindParam(':id', $id);

            if($stmt->execute()) {

                $taskStmt = $this->conn->prepare("SELECT task_id FROM task_daily_schedules WHERE id = :id");
                $taskStmt->bindParam(':id', $id);
                $taskStmt->execute();
                $sch = $taskStmt->fetch(PDO::FETCH_ASSOC);
                if ($sch && !empty($sch['task_id'])) {
                    $this->syncTaskStatusFromSchedules(intval($sch['task_id']));
                }
                return true;
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error updating schedule status: " . $e->getMessage());
            return false;
        }
    }

    public function syncTaskStatusFromSchedules($task_id) {
        if (!$this->conn) return false;

        try {
            $taskStmt = $this->conn->prepare("SELECT id, status, end_date, student_end_date FROM " . $this->table_name . " WHERE id = :task_id");
            $taskStmt->bindParam(':task_id', $task_id);
            $taskStmt->execute();
            $task = $taskStmt->fetch(PDO::FETCH_ASSOC);
            if (!$task) return false;

            $schedules = $this->getDailySchedulesByTaskId($task_id);
            if (empty($schedules)) {
                return false;
            }

            $pendingCount = 0;
            foreach ($schedules as $s) {
                $st = strtolower($s['status'] ?? 'pending');
                if ($st === 'pending') {
                    $pendingCount++;
                }
            }

            $endDate = !empty($task['student_end_date']) ? $task['student_end_date'] : $task['end_date'];
            $isPastEndDate = (strtotime($endDate) < strtotime(date('Y-m-d')));

            if ($pendingCount === 0) {

                $this->updateStatus($task_id, 'completed');
            } elseif ($isPastEndDate) {

                $this->updateStatus($task_id, 'not_completed');
            } else {

                if ($task['status'] !== 'pending') {
                    $this->updateStatus($task_id, 'pending');
                }
            }
            return true;
        } catch(PDOException $e) {
            error_log("Error syncing task status from schedules: " . $e->getMessage());
            return false;
        }
    }

    public function syncAllTasksStatus() {
        if (!$this->conn) return;

        try {

            $querySchedules = "UPDATE task_daily_schedules ds
                               JOIN " . $this->table_name . " mt ON ds.task_id = mt.id
                               SET ds.status = 'not_completed'
                               WHERE ds.status = 'pending'
                                 AND (ds.schedule_date < CURDATE() OR CURDATE() > COALESCE(mt.student_end_date, mt.end_date))";
            $this->conn->exec($querySchedules);

            $queryTasksOverdue = "UPDATE " . $this->table_name . "
                                  SET status = 'not_completed'
                                  WHERE status = 'pending'
                                    AND CURDATE() > COALESCE(student_end_date, end_date)";
            $this->conn->exec($queryTasksOverdue);

            $queryTasksFinished = "UPDATE " . $this->table_name . " mt
                                   SET mt.status = 'completed', mt.completed_at = CURDATE()
                                   WHERE mt.status = 'pending'
                                     AND EXISTS (SELECT 1 FROM task_daily_schedules ds WHERE ds.task_id = mt.id)
                                     AND NOT EXISTS (SELECT 1 FROM task_daily_schedules ds WHERE ds.task_id = mt.id AND ds.status = 'pending')";
            $this->conn->exec($queryTasksFinished);
        } catch (PDOException $e) {
            error_log("Error in syncAllTasksStatus: " . $e->getMessage());
        }
    }

    public function findTasksForGroup($event_id, $org_id, $task_title, $task_description) {
        if (!$this->conn) return [];

        $query = "SELECT id, student_id FROM " . $this->table_name . " 
                  WHERE event_id = :event_id 
                    AND organization_id = :org_id 
                    AND task_description = :task_description";
        
        if ($task_title !== null && $task_title !== '') {
            $query .= " AND task_title = :task_title";
        } else {
            $query .= " AND (task_title IS NULL OR task_title = '')";
        }

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':event_id', $event_id);
            $stmt->bindParam(':org_id', $org_id);
            $stmt->bindParam(':task_description', $task_description);
            if ($task_title !== null && $task_title !== '') {
                $stmt->bindParam(':task_title', $task_title);
            }
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            error_log("Error finding tasks for group: " . $e->getMessage());
            return [];
        }
    }

    public function findTaskForStudent($event_id, $org_id, $student_id, $task_title, $task_description) {
        if (!$this->conn) return null;

        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE event_id = :event_id 
                    AND organization_id = :org_id 
                    AND student_id = :student_id
                    AND task_description = :task_description";
        
        if ($task_title !== null && $task_title !== '') {
            $query .= " AND task_title = :task_title";
        } else {
            $query .= " AND (task_title IS NULL OR task_title = '')";
        }
        $query .= " LIMIT 1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':event_id', $event_id);
            $stmt->bindParam(':org_id', $org_id);
            $stmt->bindParam(':student_id', $student_id);
            $stmt->bindParam(':task_description', $task_description);
            if ($task_title !== null && $task_title !== '') {
                $stmt->bindParam(':task_title', $task_title);
            }
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ?: null;
        } catch(PDOException $e) {
            error_log("Error finding task for student: " . $e->getMessage());
            return null;
        }
    }

    public function readByIds($ids) {
        if (!$this->conn || empty($ids)) return [];

        $cleanIds = array_map('intval', array_values($ids));
        $inQuery = implode(',', array_fill(0, count($cleanIds), '?'));

        $query = "SELECT mt.*, s.first_name, s.last_name, s.student_number 
                  FROM " . $this->table_name . " mt
                  LEFT JOIN students s ON mt.student_id = s.id
                  WHERE mt.id IN (" . $inQuery . ")";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute($cleanIds);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            error_log("Error reading tasks by IDs: " . $e->getMessage());
            return [];
        }
    }

    public function cleanupDuplicatesByEvent($event_id) {
        if (!$this->conn) return;

        try {
            $query = "SELECT mt1.id FROM " . $this->table_name . " mt1
                      WHERE mt1.event_id = :event_id 
                      AND EXISTS (
                          SELECT 1 FROM " . $this->table_name . " mt2
                          WHERE mt2.event_id = mt1.event_id
                            AND mt2.organization_id = mt1.organization_id
                            AND mt2.student_id = mt1.student_id
                            AND COALESCE(mt2.task_title, '') = COALESCE(mt1.task_title, '')
                            AND mt2.task_description = mt1.task_description
                            AND mt2.id < mt1.id
                      )";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':event_id', $event_id);
            $stmt->execute();
            $duplicateIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

            if (!empty($duplicateIds)) {
                foreach ($duplicateIds as $dupId) {
                    $this->deleteDailySchedulesByTaskId(intval($dupId));
                    $this->delete(intval($dupId));
                }
            }
        } catch (PDOException $e) {
            error_log("Error cleaning up duplicate tasks by event: " . $e->getMessage());
        }
    }

    public function cleanupDuplicatesByOrganization($organization_id) {
        if (!$this->conn) return;

        try {
            $query = "SELECT mt1.id FROM " . $this->table_name . " mt1
                      WHERE mt1.organization_id = :organization_id 
                      AND EXISTS (
                          SELECT 1 FROM " . $this->table_name . " mt2
                          WHERE mt2.event_id = mt1.event_id
                            AND mt2.organization_id = mt1.organization_id
                            AND mt2.student_id = mt1.student_id
                            AND COALESCE(mt2.task_title, '') = COALESCE(mt1.task_title, '')
                            AND mt2.task_description = mt1.task_description
                            AND mt2.id < mt1.id
                      )";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':organization_id', $organization_id);
            $stmt->execute();
            $duplicateIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

            if (!empty($duplicateIds)) {
                foreach ($duplicateIds as $dupId) {
                    $this->deleteDailySchedulesByTaskId(intval($dupId));
                    $this->delete(intval($dupId));
                }
            }
        } catch (PDOException $e) {
            error_log("Error cleaning up duplicate tasks by organization: " . $e->getMessage());
        }
    }
}
