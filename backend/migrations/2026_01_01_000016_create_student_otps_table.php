<?php

require_once __DIR__ . '/Migration.php';

class Create_student_otps_table extends Migration {
    public function up() {
        $columns = [
            'id INT AUTO_INCREMENT PRIMARY KEY',
            'student_id INT NOT NULL',
            'otp_code VARCHAR(6) NOT NULL',
            'expiry TIMESTAMP NOT NULL',
            'attempts INT DEFAULT 0',
            'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE'
        ];
        
        $this->createTable('student_otps', $columns);
        
        echo "Student OTPs table created successfully.\n";
    }

    public function down() {
        $this->dropTable('student_otps');
        
        echo "Student OTPs table dropped successfully.\n";
    }
}
