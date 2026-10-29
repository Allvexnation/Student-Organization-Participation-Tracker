<?php

require_once __DIR__ . '/Migration.php';

class Create_sessions_table extends Migration {
    public function up() {
        $columns = [
            'id INT AUTO_INCREMENT PRIMARY KEY',
            'user_id INT NOT NULL',
            'user_type VARCHAR(50) NOT NULL',
            'token TEXT NOT NULL',
            'expires_at TIMESTAMP NOT NULL',
            'is_active TINYINT(1) DEFAULT 1',
            'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            'INDEX idx_user_id (user_id)',
            'INDEX idx_user_type (user_type)',
            'INDEX idx_token (token(255))',
            'INDEX idx_expires_at (expires_at)'
        ];
        
        $this->createTable('sessions', $columns);
        
        
        echo "Sessions table created successfully.\n";
    }

    public function down() {
        $this->dropTable('sessions');
        echo "Sessions table dropped successfully.\n";
    }
}
