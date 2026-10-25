<?php

require_once __DIR__ . '/Migration.php';

class Create_advisers_table extends Migration {
    public function up() {
        $columns = [
            'id INT AUTO_INCREMENT PRIMARY KEY',
            'profile_photo LONGBLOB DEFAULT NULL',
            'name VARCHAR(100) NOT NULL',
            'username VARCHAR(50) NOT NULL UNIQUE',
            'email VARCHAR(100) NOT NULL UNIQUE',
            'password VARCHAR(255) NOT NULL',
            'role VARCHAR(50) DEFAULT \'adviser\'',
            'status VARCHAR(20) DEFAULT \'active\'',
            'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
        ];
        
        $this->createTable('advisers', $columns);
        
        echo "Advisers table created successfully.\n";
    }

    public function down() {
        $this->dropTable('advisers');
        echo "Advisers table dropped successfully.\n";
    }
}
