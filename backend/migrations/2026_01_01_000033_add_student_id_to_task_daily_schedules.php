<?php

require_once __DIR__ . '/Migration.php';

class Add_student_id_to_task_daily_schedules extends Migration {
    public function up() {
        
        $this->addColumn('task_daily_schedules', 'student_id INT DEFAULT NULL AFTER task_id');

        $this->addForeignKey('task_daily_schedules', 'student_id', 'students', 'id', 'CASCADE');

        $this->conn->exec("ALTER TABLE task_daily_schedules DROP INDEX unique_task_date");

        $this->conn->exec("ALTER TABLE task_daily_schedules ADD UNIQUE KEY unique_task_student_date (task_id, student_id, schedule_date)");
        
        echo "Student ID column added to task_daily_schedules table successfully.\n";
    }

    public function down() {
        $this->conn->exec("ALTER TABLE task_daily_schedules DROP INDEX unique_task_student_date");

        $this->dropForeignKey('task_daily_schedules', 'student_id');

        $this->dropColumn('task_daily_schedules', 'student_id');

        $this->conn->exec("ALTER TABLE task_daily_schedules ADD UNIQUE KEY unique_task_date (task_id, schedule_date)");
        
        echo "Student ID column dropped from task_daily_schedules table successfully.\n";
    }
}
