<?php

require_once __DIR__ . '/Migration.php';

class Create_member_tasks_table extends Migration {
    public function up() {
        $columns = [
            'id INT AUTO_INCREMENT PRIMARY KEY',
            'event_id INT NOT NULL',
            'organization_id INT NOT NULL',
            'student_id INT NOT NULL',
            'task_description TEXT NOT NULL',
            'start_date DATE NOT NULL',
            'end_date DATE NOT NULL',
            'status ENUM(\'pending\', \'completed\', \'overdue\') NOT NULL DEFAULT \'pending\'',
            'completed_at DATE DEFAULT NULL',
            'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE',
            'FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE',
            'FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE',
            'INDEX idx_event_organization_student (event_id, organization_id, student_id)',
            'INDEX idx_end_date (end_date)',
            'INDEX idx_status (status)'
        ];
        
        $this->createTable('member_tasks', $columns);
        
        echo "Member tasks table created successfully.\n";
    }

    public function down() {
        $this->dropTable('member_tasks');
        echo "Member tasks table dropped successfully.\n";
    }
}
