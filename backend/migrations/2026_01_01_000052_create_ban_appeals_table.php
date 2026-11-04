<?php

require_once __DIR__ . '/Migration.php';

class Create_ban_appeals_table extends Migration {
    public function up() {
        $columns = [
            'id INT AUTO_INCREMENT PRIMARY KEY',
            'name VARCHAR(255) NOT NULL',
            'email VARCHAR(255) NOT NULL',
            'ip_address VARCHAR(45) NOT NULL',
            'subject VARCHAR(255) NOT NULL',
            'reason TEXT NOT NULL',
            "status ENUM('pending', 'under_review', 'resolved') DEFAULT 'pending'",
            'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            'INDEX idx_email (email)',
            'INDEX idx_ip_address (ip_address)',
            'INDEX idx_status (status)',
            'INDEX idx_created_at (created_at)'
        ];
        
        $this->createTable('ban_appeals', $columns);
        
        echo "Ban appeals table created successfully.\n";
    }

    public function down() {
        $this->dropTable('ban_appeals');
        echo "Ban appeals table dropped successfully.\n";
    }
}
