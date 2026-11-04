<?php

require_once __DIR__ . '/Migration.php';

class Create_admin_otps_table extends Migration {
    public function up() {
        $columns = [
            'id INT AUTO_INCREMENT PRIMARY KEY',
            'admin_id INT NOT NULL',
            'otp_code VARCHAR(6) NOT NULL',
            'expiry TIMESTAMP NOT NULL',
            'attempts INT DEFAULT 0',
            'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE'
        ];
        
        $this->createTable('admin_otps', $columns);
        
        echo "Admin OTPs table created successfully.\n";
    }

    public function down() {
        $this->dropTable('admin_otps');
        
        echo "Admin OTPs table dropped successfully.\n";
    }
}
