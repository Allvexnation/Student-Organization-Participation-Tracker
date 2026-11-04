<?php

require_once __DIR__ . '/Migration.php';

class Create_support_contacts_table extends Migration {
    public function up() {
        $columns = [
            'id INT AUTO_INCREMENT PRIMARY KEY',
            'name VARCHAR(255) NOT NULL',
            'email VARCHAR(255) NOT NULL',
            'subject VARCHAR(255) NOT NULL',
            'message TEXT NOT NULL',
            "status ENUM('pending', 'receive', 'under_review', 'resolved') DEFAULT 'pending'",
            'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
        ];
        
        $this->createTable('support_contacts', $columns);
        
        echo "Support contacts table created successfully.\n";
    }

    public function down() {
        $this->dropTable('support_contacts');
        
        echo "Support contacts table dropped successfully.\n";
    }
}
