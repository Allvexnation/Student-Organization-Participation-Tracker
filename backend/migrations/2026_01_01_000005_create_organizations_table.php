<?php

require_once __DIR__ . '/Migration.php';

class Create_organizations_table extends Migration {
    public function up() {
        $columns = [
            'id INT AUTO_INCREMENT PRIMARY KEY',
            'org_code VARCHAR(50) NOT NULL UNIQUE',
            'name VARCHAR(255) NOT NULL',
            'description TEXT',
            'adviser VARCHAR(255)',
            'status VARCHAR(50) NOT NULL DEFAULT "Active"',
            'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
        ];
        
        $this->createTable('organizations', $columns);
        
        echo "Organizations table created successfully.\n";
    }

    public function down() {
        $this->dropTable('organizations');
        echo "Organizations table dropped successfully.\n";
    }
}
