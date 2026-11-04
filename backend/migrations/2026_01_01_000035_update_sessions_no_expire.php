<?php

require_once __DIR__ . '/Migration.php';

class Update_sessions_no_expire extends Migration {
    public function up() {
        try {
            $this->conn->exec("ALTER TABLE sessions MODIFY COLUMN expires_at TIMESTAMP NULL DEFAULT '2038-01-19 03:14:07'");
            $this->conn->exec("UPDATE sessions SET expires_at = '2038-01-19 03:14:07' WHERE is_active = 1");
            echo "Sessions table updated to never expire successfully.\n";
        } catch (PDOException $e) {
            echo "Error updating sessions table: " . $e->getMessage() . "\n";
        }
    }

    public function down() {
        try {
            $this->conn->exec("ALTER TABLE sessions MODIFY COLUMN expires_at TIMESTAMP NOT NULL");
            echo "Sessions table expiration reverted.\n";
        } catch (PDOException $e) {
            echo "Error reverting sessions table: " . $e->getMessage() . "\n";
        }
    }
}

