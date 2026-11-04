<?php

require_once __DIR__ . '/Migration.php';

class Create_audit_logs_table extends Migration {
    public function up() {
        $columns = [
            'id INT AUTO_INCREMENT PRIMARY KEY',
            'user_id INT NOT NULL',
            "user_type ENUM('admin', 'adviser', 'student') NOT NULL",
            'action VARCHAR(50) NOT NULL',
            'table_name VARCHAR(100) NOT NULL',
            'record_id INT',
            'field_name VARCHAR(100)',
            'old_value TEXT',
            'new_value TEXT',
            'ip_address VARCHAR(45)',
            'device_type VARCHAR(50)',
            'device_brand VARCHAR(100)',
            'browser VARCHAR(100)',
            'os VARCHAR(100)',
            'user_agent TEXT',
            'screen_resolution VARCHAR(50)',
            'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
        ];
        
        $this->createTable('audit_logs', $columns);

        try {
            $this->conn->exec("ALTER TABLE audit_logs 
                ADD CONSTRAINT fk_audit_logs_admin 
                FOREIGN KEY (user_id) REFERENCES admins(id) 
                ON DELETE CASCADE");
        } catch (PDOException $e) {
            echo "Foreign key for admins may already exist or not applicable: " . $e->getMessage() . "\n";
        }
        
        try {
            $this->conn->exec("ALTER TABLE audit_logs ADD INDEX idx_user_id (user_id)");
        } catch (PDOException $e) {
            echo "Index idx_user_id may already exist: " . $e->getMessage() . "\n";
        }
        
        try {
            $this->conn->exec("ALTER TABLE audit_logs ADD INDEX idx_user_type (user_type)");
        } catch (PDOException $e) {
            echo "Index idx_user_type may already exist: " . $e->getMessage() . "\n";
        }
        
        try {
            $this->conn->exec("ALTER TABLE audit_logs ADD INDEX idx_table_name (table_name)");
        } catch (PDOException $e) {
            echo "Index idx_table_name may already exist: " . $e->getMessage() . "\n";
        }
        
        try {
            $this->conn->exec("ALTER TABLE audit_logs ADD INDEX idx_created_at (created_at)");
        } catch (PDOException $e) {
            echo "Index idx_created_at may already exist: " . $e->getMessage() . "\n";
        }
        
        try {
            $this->conn->exec("ALTER TABLE audit_logs ADD INDEX idx_action (action)");
        } catch (PDOException $e) {
            echo "Index idx_action may already exist: " . $e->getMessage() . "\n";
        }
        
        echo "Audit logs table created successfully.\n";
    }

    public function down() {
        $this->dropTable('audit_logs');
        echo "Audit logs table dropped successfully.\n";
    }
}
