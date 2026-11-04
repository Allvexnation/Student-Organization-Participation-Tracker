<?php

require_once __DIR__ . '/Migration.php';

class Update_task_statuses_and_voiding extends Migration {
    public function up() {

        $this->conn->exec("ALTER TABLE member_tasks MODIFY COLUMN status ENUM('pending', 'completed', 'not_completed', 'not_finished', 'overdue') NOT NULL DEFAULT 'pending'");

        $checkCol = function($table, $col) {
            $stmt = $this->conn->query("SHOW COLUMNS FROM `{$table}` LIKE '{$col}'");
            return $stmt->rowCount() > 0;
        };

        if (!$checkCol('member_tasks', 'marked_by')) {
            $this->conn->exec("ALTER TABLE member_tasks ADD COLUMN marked_by ENUM('student', 'adviser', 'system') DEFAULT NULL AFTER status");
        }
        if (!$checkCol('member_tasks', 'marked_at')) {
            $this->conn->exec("ALTER TABLE member_tasks ADD COLUMN marked_at DATETIME DEFAULT NULL AFTER marked_by");
        }
        if (!$checkCol('member_tasks', 'is_voided')) {
            $this->conn->exec("ALTER TABLE member_tasks ADD COLUMN is_voided TINYINT(1) NOT NULL DEFAULT 0 AFTER marked_at");
        }
        if (!$checkCol('member_tasks', 'voided_by')) {
            $this->conn->exec("ALTER TABLE member_tasks ADD COLUMN voided_by INT DEFAULT NULL AFTER is_voided");
        }
        if (!$checkCol('member_tasks', 'voided_at')) {
            $this->conn->exec("ALTER TABLE member_tasks ADD COLUMN voided_at DATETIME DEFAULT NULL AFTER voided_by");
        }
        if (!$checkCol('member_tasks', 'void_reason')) {
            $this->conn->exec("ALTER TABLE member_tasks ADD COLUMN void_reason VARCHAR(255) DEFAULT NULL AFTER voided_at");
        }

        $this->conn->exec("ALTER TABLE task_daily_schedules MODIFY COLUMN status ENUM('pending', 'completed', 'not_completed', 'not_finished') NOT NULL DEFAULT 'pending'");

        if (!$checkCol('task_daily_schedules', 'marked_by')) {
            $this->conn->exec("ALTER TABLE task_daily_schedules ADD COLUMN marked_by ENUM('student', 'adviser', 'system') DEFAULT NULL AFTER status");
        }
        if (!$checkCol('task_daily_schedules', 'marked_at')) {
            $this->conn->exec("ALTER TABLE task_daily_schedules ADD COLUMN marked_at DATETIME DEFAULT NULL AFTER marked_by");
        }
        if (!$checkCol('task_daily_schedules', 'is_voided')) {
            $this->conn->exec("ALTER TABLE task_daily_schedules ADD COLUMN is_voided TINYINT(1) NOT NULL DEFAULT 0 AFTER marked_at");
        }
        if (!$checkCol('task_daily_schedules', 'voided_by')) {
            $this->conn->exec("ALTER TABLE task_daily_schedules ADD COLUMN voided_by INT DEFAULT NULL AFTER is_voided");
        }
        if (!$checkCol('task_daily_schedules', 'voided_at')) {
            $this->conn->exec("ALTER TABLE task_daily_schedules ADD COLUMN voided_at DATETIME DEFAULT NULL AFTER voided_by");
        }
        if (!$checkCol('task_daily_schedules', 'void_reason')) {
            $this->conn->exec("ALTER TABLE task_daily_schedules ADD COLUMN void_reason VARCHAR(255) DEFAULT NULL AFTER voided_at");
        }

        echo "Updated task statuses and voiding columns successfully.\n";
    }

    public function down() {
        $dropCol = function($table, $col) {
            $stmt = $this->conn->query("SHOW COLUMNS FROM `{$table}` LIKE '{$col}'");
            if ($stmt->rowCount() > 0) {
                $this->conn->exec("ALTER TABLE `{$table}` DROP COLUMN `{$col}`");
            }
        };

        $cols = ['void_reason', 'voided_at', 'voided_by', 'is_voided', 'marked_at', 'marked_by'];
        foreach ($cols as $col) {
            $dropCol('member_tasks', $col);
            $dropCol('task_daily_schedules', $col);
        }

        $this->conn->exec("ALTER TABLE member_tasks MODIFY COLUMN status ENUM('pending', 'completed', 'overdue') NOT NULL DEFAULT 'pending'");
        $this->conn->exec("ALTER TABLE task_daily_schedules MODIFY COLUMN status ENUM('pending', 'completed', 'not_completed') NOT NULL DEFAULT 'pending'");

        echo "Reverted task statuses and voiding columns.\n";
    }
}

