<?php

require_once __DIR__ . '/Migration.php';

class Create_students_table extends Migration {
    public function up() {
        $columns = [
            'id INT AUTO_INCREMENT PRIMARY KEY',
            'profile_photo LONGBLOB DEFAULT NULL',
            'student_number VARCHAR(50) NOT NULL UNIQUE',
            'first_name VARCHAR(100) NOT NULL',
            'last_name VARCHAR(100) NOT NULL',
            'program VARCHAR(100) NOT NULL',
            'year_level VARCHAR(20) NOT NULL',
            'username VARCHAR(50) NOT NULL UNIQUE',
            'email VARCHAR(100) NOT NULL UNIQUE',
            'password VARCHAR(255) NOT NULL',
            'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
        ];
        
        $this->createTable('students', $columns);
        
        echo "Students table created successfully.\n";
    }

    public function down() {
        $this->dropTable('students');
        echo "Students table dropped successfully.\n";
    }
}
