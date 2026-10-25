<?php

require_once __DIR__ . '/Migration.php';

class Create_roles_table extends Migration {
    public function up() {
        $columns = [
            'id INT AUTO_INCREMENT PRIMARY KEY',
            'role_name VARCHAR(100) NOT NULL UNIQUE',
            'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
        ];
        
        $this->createTable('roles', $columns);
        
        echo "Roles table created successfully.\n";
    }

    public function down() {
        $this->dropTable('roles');
        echo "Roles table dropped successfully.\n";
    }
}
