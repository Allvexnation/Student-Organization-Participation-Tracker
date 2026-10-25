<?php

require_once __DIR__ . '/Migration.php';

class Create_event_registrations_table extends Migration {
    public function up() {
        $columns = [
            'id INT AUTO_INCREMENT PRIMARY KEY',
            'event_id INT NOT NULL',
            'student_id INT NOT NULL',
            'registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE',
            'FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE',
            'UNIQUE KEY unique_event_student (event_id, student_id)'
        ];
        
        $this->createTable('event_registrations', $columns);
        
        echo "Event registrations table created successfully.\n";
    }

    public function down() {
        $this->dropTable('event_registrations');
        echo "Event registrations table dropped successfully.\n";
    }
}
