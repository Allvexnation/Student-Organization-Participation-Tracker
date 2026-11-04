<?php

require_once __DIR__ . '/Migration.php';

class Create_bans_table extends Migration {
    public function up() {
        $columns = [
            'id INT AUTO_INCREMENT PRIMARY KEY',
            "ban_type ENUM('session', 'overall', 'ip') NOT NULL",
            "target_type ENUM('admin', 'adviser', 'student') NULL",
            'target_id INT NULL',
            'session_id INT NULL',
            'ip_address VARCHAR(45) NULL',
            'reason TEXT NOT NULL',
            'banned_by INT NOT NULL',
            "ban_duration_type ENUM('permanent', 'temporary') NOT NULL",
            'expires_at TIMESTAMP NULL',
            'is_active TINYINT(1) DEFAULT 1',
            'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            'INDEX idx_ban_type (ban_type)',
            'INDEX idx_target (target_type, target_id)',
            'INDEX idx_session_id (session_id)',
            'INDEX idx_ip_address (ip_address)',
            'INDEX idx_banned_by (banned_by)',
            'INDEX idx_expires_at (expires_at)',
            'INDEX idx_is_active (is_active)',
            'FOREIGN KEY (banned_by) REFERENCES admins(id) ON DELETE CASCADE'
        ];
        
        $this->createTable('bans', $columns);
        
        echo "Bans table created successfully.\n";
    }

    public function down() {
        $this->dropTable('bans');
        echo "Bans table dropped successfully.\n";
    }
}
