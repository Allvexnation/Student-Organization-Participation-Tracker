<?php

require_once __DIR__ . '/Migration.php';

class Create_organization_memberships_table extends Migration {
    public function up() {
        $columns = [
            'id INT AUTO_INCREMENT PRIMARY KEY',
            'organization_id INT NOT NULL',
            'student_id INT NOT NULL',
            'date_joined DATE NOT NULL',
            'position VARCHAR(100) NOT NULL',
            'membership_status VARCHAR(20) NOT NULL DEFAULT "Active"',
            'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE',
            'FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE',
            'UNIQUE KEY unique_active_membership (student_id, organization_id, membership_status)'
        ];
        
        $this->createTable('organization_memberships', $columns);
        
        echo "Organization memberships table created successfully.\n";
    }

    public function down() {
        $this->dropTable('organization_memberships');
        echo "Organization memberships table dropped successfully.\n";
    }
}
