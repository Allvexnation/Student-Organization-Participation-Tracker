<?php

require_once __DIR__ . '/Migration.php';

class Add_day_number_to_task_daily_schedules extends Migration {
    public function up() {
        $checkCol = function($table, $col) {
            $stmt = $this->conn->query("SHOW COLUMNS FROM `{$table}` LIKE '{$col}'");
            return $stmt->rowCount() > 0;
        };

        if (!$checkCol('task_daily_schedules', 'day_number')) {
            $this->conn->exec("ALTER TABLE task_daily_schedules ADD COLUMN day_number INT DEFAULT NULL AFTER student_id");
            echo "Added day_number column to task_daily_schedules.\n";
        }

        $tasksStmt = $this->conn->query("SELECT DISTINCT task_id, student_id FROM task_daily_schedules");
        $pairs = $tasksStmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($pairs as $p) {
            $taskId = $p['task_id'];
            $studentId = $p['student_id'];

            if ($studentId !== null) {
                $schStmt = $this->conn->prepare("SELECT id FROM task_daily_schedules WHERE task_id = :task_id AND student_id = :student_id ORDER BY schedule_date ASC, start_time ASC");
                $schStmt->bindParam(':task_id', $taskId);
                $schStmt->bindParam(':student_id', $studentId);
            } else {
                $schStmt = $this->conn->prepare("SELECT id FROM task_daily_schedules WHERE task_id = :task_id AND student_id IS NULL ORDER BY schedule_date ASC, start_time ASC");
                $schStmt->bindParam(':task_id', $taskId);
            }
            $schStmt->execute();
            $schedules = $schStmt->fetchAll(PDO::FETCH_ASSOC);

            $dayNum = 1;
            foreach ($schedules as $s) {
                $updStmt = $this->conn->prepare("UPDATE task_daily_schedules SET day_number = :day_num WHERE id = :id");
                $updStmt->bindParam(':day_num', $dayNum);
                $updStmt->bindParam(':id', $s['id']);
                $updStmt->execute();
                $dayNum++;
            }
        }

        echo "Populated day_number for existing task schedules.\n";
    }

    public function down() {
        $checkCol = function($table, $col) {
            $stmt = $this->conn->query("SHOW COLUMNS FROM `{$table}` LIKE '{$col}'");
            return $stmt->rowCount() > 0;
        };

        if ($checkCol('task_daily_schedules', 'day_number')) {
            $this->conn->exec("ALTER TABLE task_daily_schedules DROP COLUMN day_number");
            echo "Dropped day_number column from task_daily_schedules.\n";
        }
    }
}

