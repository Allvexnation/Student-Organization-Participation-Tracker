<?php

require_once __DIR__ . '/Migration.php';

class Create_task_daily_schedules_table extends Migration {
    public function up() {
        $columns = [
            'id INT AUTO_INCREMENT PRIMARY KEY',
            'task_id INT NOT NULL',
            'schedule_date DATE NOT NULL',
            'start_time TIME NOT NULL',
            'end_time TIME NOT NULL',
            'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'FOREIGN KEY (task_id) REFERENCES member_tasks(id) ON DELETE CASCADE',
            'UNIQUE KEY unique_task_date (task_id, schedule_date)',
            'INDEX idx_task_id (task_id)',
            'INDEX idx_schedule_date (schedule_date)'
        ];
        
        $this->createTable('task_daily_schedules', $columns);
        
        echo "Task daily schedules table created successfully.\n";
    }

    public function down() {
        $this->dropTable('task_daily_schedules');
        echo "Task daily schedules table dropped successfully.\n";
    }
}
