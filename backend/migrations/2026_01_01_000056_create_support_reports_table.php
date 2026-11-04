<?php

require_once __DIR__ . '/Migration.php';

class Create_support_reports_table extends Migration {
    public function up() {
        $columns = [
            'id INT AUTO_INCREMENT PRIMARY KEY',
            'report_id VARCHAR(20) NOT NULL UNIQUE',
            'name VARCHAR(255) NOT NULL',
            'email VARCHAR(255) NOT NULL',
            "subject ENUM('Bugs', 'Error', 'Glitches', 'System Issue') NOT NULL",
            'link VARCHAR(500) NOT NULL',
            'console_log TEXT DEFAULT NULL',
            'description TEXT NOT NULL',
            'images JSON DEFAULT NULL',
            "status ENUM('pending', 'receive', 'under_review', 'resolved') DEFAULT 'pending'",
            'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
        ];
        
        $this->createTable('support_reports', $columns);
        
        echo "Support reports table created successfully.\n";
    }

    public function down() {
        $this->dropTable('support_reports');
        
        echo "Support reports table dropped successfully.\n";
    }
}
