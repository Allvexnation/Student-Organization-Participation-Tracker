<?php

require_once __DIR__ . '/Migration.php';

class Populate_missing_task_daily_schedules extends Migration {
    public function up() {

        $stmt = $this->conn->query("
            SELECT mt.id, mt.student_id, mt.start_date, mt.end_date, mt.student_start_date, mt.student_end_date,
                   mt.status, mt.marked_by, mt.marked_at, mt.is_voided, mt.voided_by, mt.voided_at, mt.void_reason
            FROM member_tasks mt
            LEFT JOIN task_daily_schedules ds ON mt.id = ds.task_id
            WHERE ds.id IS NULL
        ");
        $tasksWithoutSchedules = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $insertedCount = 0;
        foreach ($tasksWithoutSchedules as $task) {
            $taskId = $task['id'];
            $studentId = $task['student_id'];
            $startDateStr = !empty($task['student_start_date']) ? $task['student_start_date'] : $task['start_date'];
            $endDateStr = !empty($task['student_end_date']) ? $task['student_end_date'] : $task['end_date'];

            if (empty($startDateStr) || empty($endDateStr)) {
                continue;
            }

            try {
                $start = new DateTime($startDateStr);
                $end = new DateTime($endDateStr);
                if ($start > $end) {
                    $end = clone $start;
                }
                $end->modify('+1 day');
                $period = new DatePeriod($start, new DateInterval('P1D'), $end);

                $dayNum = 1;
                $insertStmt = $this->conn->prepare("
                    INSERT INTO task_daily_schedules 
                    (task_id, student_id, day_number, schedule_date, start_time, end_time, status, marked_by, marked_at, is_voided, voided_by, voided_at, void_reason)
                    VALUES (:task_id, :student_id, :day_number, :schedule_date, '08:00:00', '17:00:00', :status, :marked_by, :marked_at, :is_voided, :voided_by, :voided_at, :void_reason)
                ");

                foreach ($period as $dt) {
                    $schDate = $dt->format('Y-m-d');
                    $status = in_array($task['status'], ['completed', 'not_completed', 'not_finished']) ? $task['status'] : 'pending';
                    $isVoided = intval($task['is_voided'] ?? 0);

                    $insertStmt->bindParam(':task_id', $taskId);
                    $insertStmt->bindParam(':student_id', $studentId);
                    $insertStmt->bindParam(':day_number', $dayNum);
                    $insertStmt->bindParam(':schedule_date', $schDate);
                    $insertStmt->bindParam(':status', $status);
                    $insertStmt->bindParam(':marked_by', $task['marked_by']);
                    $insertStmt->bindParam(':marked_at', $task['marked_at']);
                    $insertStmt->bindParam(':is_voided', $isVoided, PDO::PARAM_INT);
                    $insertStmt->bindParam(':voided_by', $task['voided_by']);
                    $insertStmt->bindParam(':voided_at', $task['voided_at']);
                    $insertStmt->bindParam(':void_reason', $task['void_reason']);
                    $insertStmt->execute();

                    $dayNum++;
                    $insertedCount++;
                }
            } catch (Exception $e) {
                error_log("Error creating schedules for task {$taskId}: " . $e->getMessage());
            }
        }

        echo "Populated {$insertedCount} daily schedules for tasks without schedules.\n";
    }

    public function down() {
        echo "No reversal needed for populating missing schedules.\n";
    }
}

