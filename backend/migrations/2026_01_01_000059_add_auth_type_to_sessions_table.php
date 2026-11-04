<?php

require_once __DIR__ . '/Migration.php';

class Add_auth_type_to_sessions_table extends Migration {
    public function up() {
        $this->addColumn('sessions', "auth_type VARCHAR(50) DEFAULT 'password'");
        
        try {
            $this->conn->exec("ALTER TABLE sessions ADD INDEX idx_auth_type (auth_type)");
        } catch (PDOException $e) {
            echo "Index idx_auth_type may already exist: " . $e->getMessage() . "\n";
        }
        
        echo "Auth type column added to sessions table successfully.\n";
    }

    public function down() {
        $this->dropColumn('sessions', 'auth_type');
        
        try {
            $this->conn->exec("ALTER TABLE sessions DROP INDEX idx_auth_type");
        } catch (PDOException $e) {
            echo "Index idx_auth_type may not exist: " . $e->getMessage() . "\n";
        }
        
        echo "Auth type column dropped from sessions table successfully.\n";
    }
}
