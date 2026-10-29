<?php

require_once __DIR__ . '/Migration.php';

class Create_adviser_otps_table extends Migration {
    public function up() {
        $columns = [
            'id INT AUTO_INCREMENT PRIMARY KEY',
            'adviser_id INT NOT NULL',
            'otp_code VARCHAR(6) NOT NULL',
            'expiry TIMESTAMP NOT NULL',
            'attempts INT DEFAULT 0',
            'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'FOREIGN KEY (adviser_id) REFERENCES advisers(id) ON DELETE CASCADE'
        ];
        
        $this->createTable('adviser_otps', $columns);
        
        echo "Adviser OTPs table created successfully.\n";
    }

    public function down() {
        $this->dropTable('adviser_otps');
        
        echo "Adviser OTPs table dropped successfully.\n";
    }
}
