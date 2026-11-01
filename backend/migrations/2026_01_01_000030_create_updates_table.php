<?php

require_once __DIR__ . '/Migration.php';

class Create_updates_table extends Migration {
    public function up() {
        $columns = [
            'id INT AUTO_INCREMENT PRIMARY KEY',
            'version VARCHAR(50) NOT NULL',
            'name VARCHAR(255) NOT NULL',
            'branch VARCHAR(100) NOT NULL DEFAULT "main"',
            'readme_content LONGTEXT NOT NULL',
            'readme_filename VARCHAR(255) DEFAULT NULL',
            'assets LONGTEXT DEFAULT NULL',
            'is_updated TINYINT(1) NOT NULL DEFAULT 0',
            "closable_type ENUM('closable', 'not_closable', 'show_once') NOT NULL DEFAULT 'closable'",
            'is_active TINYINT(1) DEFAULT 1',
            'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
        ];
        
        $this->createTable('updates', $columns);
        
        echo "Updates table created successfully.\n";
    }

    public function down() {
        $this->dropTable('updates');
        echo "Updates table dropped successfully.\n";
    }
}
