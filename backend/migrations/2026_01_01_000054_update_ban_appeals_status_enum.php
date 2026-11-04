<?php

require_once __DIR__ . '/Migration.php';

class Update_ban_appeals_status_enum extends Migration {
    public function up() {
        $query = "ALTER TABLE ban_appeals 
                  MODIFY COLUMN status ENUM('pending', 'under_review', 'resolved') DEFAULT 'pending'";
        
        try {
            $this->conn->exec($query);
            echo "Ban appeals status enum updated successfully.\n";
            return true;
        } catch(PDOException $e) {
            echo "Migration Error: " . $e->getMessage() . "\n";
            return false;
        }
    }

    public function down() {
        $query = "ALTER TABLE ban_appeals 
                  MODIFY COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'";
        
        try {
            $this->conn->exec($query);
            echo "Ban appeals status enum reverted successfully.\n";
            return true;
        } catch(PDOException $e) {
            echo "Migration Error: " . $e->getMessage() . "\n";
            return false;
        }
    }
}
