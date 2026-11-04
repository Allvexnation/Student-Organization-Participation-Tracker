<?php

require_once __DIR__ . '/Migration.php';

class Create_attendance_table extends Migration {
    public function up() {
        $columns = [
            'id INT AUTO_INCREMENT PRIMARY KEY',
            'student_id INT NOT NULL',
            'adviser_id INT NOT NULL',
            'event_id INT NOT NULL',
            'organization_id INT NOT NULL',
            'schedule_date DATE NOT NULL',
            'time_in_am TIME NULL',
            'time_out_am TIME NULL',
            'break_out TIME NULL',
            'break_in TIME NULL',
            'time_in_pm TIME NULL',
            'time_out_pm TIME NULL',
            'absent_session VARCHAR(20) NULL',
            'is_absent TINYINT(1) DEFAULT 0',
            'is_excused TINYINT(1) DEFAULT 0',
            'excuse_reason TEXT NULL',
            'excuse_session VARCHAR(20) NULL',
            'excuse_status VARCHAR(20) NULL',
            'marked_by VARCHAR(20) DEFAULT \'student\'',
            'status VARCHAR(50) DEFAULT \'Pending\'',
            'duration_minutes INT DEFAULT 0',
            'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            'FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE',
            'FOREIGN KEY (adviser_id) REFERENCES advisers(id) ON DELETE CASCADE',
            'FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE',
            'FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE',
            'UNIQUE KEY unique_student_event_date (student_id, event_id, schedule_date)',
            'INDEX idx_student_event (student_id, event_id)',
            'INDEX idx_event_date (event_id, schedule_date)',
            'INDEX idx_adviser_event (adviser_id, event_id)'
        ];

        $this->createTable('attendances', $columns);
        echo "Attendances table created successfully.\n";
    }

    public function down() {
        $this->dropTable('attendances');
        echo "Attendances table dropped successfully.\n";
    }
}
