<?php

require_once __DIR__ . '/Migration.php';

class Add_device_info_to_sessions_table extends Migration {
    public function up() {
        $columns = [
            'ip_address VARCHAR(45)',
            'user_agent TEXT',
            'device_type VARCHAR(50)',
            'device_fingerprint VARCHAR(255)',
            'screen_resolution VARCHAR(50)',
            'browser VARCHAR(100)',
            'os VARCHAR(100)',
            'country VARCHAR(100)',
            'city VARCHAR(100)',
            'timezone VARCHAR(100)'
        ];
        
        foreach ($columns as $column) {
            $this->addColumn('sessions', $column);
        }
        
        try {
            $this->conn->exec("ALTER TABLE sessions ADD INDEX idx_ip_address (ip_address)");
        } catch (PDOException $e) {
            echo "Index idx_ip_address may already exist: " . $e->getMessage() . "\n";
        }
        
        try {
            $this->conn->exec("ALTER TABLE sessions ADD INDEX idx_device_fingerprint (device_fingerprint)");
        } catch (PDOException $e) {
            echo "Index idx_device_fingerprint may already exist: " . $e->getMessage() . "\n";
        }
        
        echo "Device info columns added to sessions table successfully.\n";
    }

    public function down() {
        $columns = [
            'ip_address',
            'user_agent',
            'device_type',
            'device_fingerprint',
            'screen_resolution',
            'browser',
            'os',
            'country',
            'city',
            'timezone'
        ];
        
        foreach ($columns as $column) {
            $this->dropColumn('sessions', $column);
        }
        
        echo "Device info columns dropped from sessions table successfully.\n";
    }
}
