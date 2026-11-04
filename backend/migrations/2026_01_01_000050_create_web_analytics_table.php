<?php

require_once __DIR__ . '/Migration.php';

class Create_web_analytics_table extends Migration {
    public function up() {
        $columns = [
            'id INT AUTO_INCREMENT PRIMARY KEY',
            'route VARCHAR(255) NOT NULL',
            'ip_address VARCHAR(45) NULL',
            "device_type ENUM('Desktop', 'Mobile', 'Tablet') NULL",
            'browser VARCHAR(50) NULL',
            'os VARCHAR(50) NULL',
            'user_agent TEXT NULL',
            'screen_resolution VARCHAR(20) NULL',
            'language VARCHAR(10) NULL',
            'country VARCHAR(100) NULL',
            'country_code VARCHAR(5) NULL',
            'region VARCHAR(100) NULL',
            'city VARCHAR(100) NULL',
            'latitude DECIMAL(10, 8) NULL',
            'longitude DECIMAL(11, 8) NULL',
            'user_id INT NULL',
            "user_type ENUM('admin', 'adviser', 'student') NULL",
            'visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'INDEX idx_route (route)',
            'INDEX idx_ip_address (ip_address)',
            'INDEX idx_device_type (device_type)',
            'INDEX idx_country (country)',
            'INDEX idx_user (user_type, user_id)',
            'INDEX idx_visited_at (visited_at)'
        ];
        
        $this->createTable('web_analytics', $columns);
        
        echo "Web analytics table created successfully.\n";
    }

    public function down() {
        $this->dropTable('web_analytics');
        echo "Web analytics table dropped successfully.\n";
    }
}
