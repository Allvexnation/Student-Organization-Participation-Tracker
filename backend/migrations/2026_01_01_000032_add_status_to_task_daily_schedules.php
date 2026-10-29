<?php

require_once __DIR__ . '/Migration.php';

class Add_status_to_task_daily_schedules extends Migration {
    public function up() {
        $this->addColumn('task_daily_schedules', "status ENUM('pending', 'completed', 'not_completed') DEFAULT 'pending' AFTER end_time");
        echo "Status column added to task_daily_schedules table successfully.\n";
    }

    public function down() {
        $this->dropColumn('task_daily_schedules', 'status');
        echo "Status column dropped from task_daily_schedules table successfully.\n";
    }
}
