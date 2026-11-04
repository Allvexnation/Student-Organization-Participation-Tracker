<?php

require_once __DIR__ . '/Migration.php';

class Add_not_openable_to_closable_type extends Migration {
    public function up() {
        $sql = "ALTER TABLE updates MODIFY COLUMN closable_type ENUM('closable', 'not_closable', 'show_once', 'not_openable') NOT NULL DEFAULT 'closable'";
        
        try {
            $this->conn->exec($sql);
            echo "Added 'not_openable' to closable_type enum successfully.\n";
        } catch(PDOException $e) {
            echo "Error adding 'not_openable' to closable_type enum: " . $e->getMessage() . "\n";
            echo "SQL: {$sql}\n";
            return false;
        }
    }

    public function down() {
        $sql = "ALTER TABLE updates MODIFY COLUMN closable_type ENUM('closable', 'not_closable', 'show_once') NOT NULL DEFAULT 'closable'";
        
        try {
            $this->conn->exec($sql);
            echo "Removed 'not_openable' from closable_type enum successfully.\n";
        } catch(PDOException $e) {
            echo "Error removing 'not_openable' from closable_type enum: " . $e->getMessage() . "\n";
            echo "SQL: {$sql}\n";
            return false;
        }
    }
}
