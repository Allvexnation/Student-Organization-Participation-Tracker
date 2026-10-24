<?php

require_once __DIR__ . '/Migration.php';

class Create_admins_table extends Migration {
    public function up() {
        $columns = [
            'id INT AUTO_INCREMENT PRIMARY KEY',
            'profile_photo LONGBLOB DEFAULT NULL',
            'name VARCHAR(100) NOT NULL',
            'username VARCHAR(50) NOT NULL UNIQUE',
            'email VARCHAR(100) NOT NULL UNIQUE',
            'password VARCHAR(255) NOT NULL',
            'role VARCHAR(50) DEFAULT \'admin\'',
            'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
        ];
        
        $this->createTable('admins', $columns);
        
        echo "Admins table created successfully.\n";
    }

    public function down() {
        $this->dropTable('admins');
        echo "Admins table dropped successfully.\n";
    }
}
