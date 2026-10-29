<?php

require_once __DIR__ . '/Migration.php';

class Create_event_daily_schedules_table extends Migration {
    public function up() {
        $columns = [
            'id INT AUTO_INCREMENT PRIMARY KEY',
            'event_id INT NOT NULL',
            'schedule_date DATE NOT NULL',
            'start_time TIME NOT NULL',
            'end_time TIME NOT NULL',
            'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            'FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE',
            'UNIQUE KEY unique_event_date (event_id, schedule_date)'
        ];
        
        $this->createTable('event_daily_schedules', $columns);
        
        echo "Event daily schedules table created successfully.\n";
    }

    public function down() {
        $this->dropTable('event_daily_schedules');
        echo "Event daily schedules table dropped successfully.\n";
    }
}
