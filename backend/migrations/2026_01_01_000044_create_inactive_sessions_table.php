<?php

require_once __DIR__ . '/Migration.php';

class Create_inactive_sessions_table extends Migration {
    public function up() {
        $columns = [
            'id INT AUTO_INCREMENT PRIMARY KEY',
            'user_id INT NOT NULL',
            'user_type VARCHAR(50) NOT NULL',
            'token TEXT NOT NULL',
            'expires_at TIMESTAMP NOT NULL',
            'is_active TINYINT(1) DEFAULT 1',
            'ip_address VARCHAR(45)',
            'user_agent TEXT',
            'device_type VARCHAR(50)',
            'device_fingerprint VARCHAR(255)',
            'screen_resolution VARCHAR(50)',
            'browser VARCHAR(100)',
            'os VARCHAR(100)',
            'country VARCHAR(100)',
            'city VARCHAR(100)',
            'timezone VARCHAR(100)',
            'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            'INDEX idx_user_id (user_id)',
            'INDEX idx_user_type (user_type)',
            'INDEX idx_token (token(255))',
            'INDEX idx_expires_at (expires_at)'
        ];
        
        $this->createTable('inactive_sessions', $columns);
        
        echo "Inactive sessions table created successfully.\n";
    }

    public function down() {
        $this->dropTable('inactive_sessions');
        echo "Inactive sessions table dropped successfully.\n";
    }
}
