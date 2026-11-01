<?php

require_once __DIR__ . '/Migration.php';

class Increase_assets_file_to_text extends Migration {
    public function up() {
        $sql = "ALTER TABLE updates MODIFY COLUMN assets_file TEXT DEFAULT NULL";
        
        try {
            $this->conn->exec($sql);
            echo "Increased assets_file from VARCHAR(500) to TEXT for multiple Cloudinary URLs.\n";
        } catch(PDOException $e) {
            echo "Error increasing column type: " . $e->getMessage() . "\n";
        }
    }

    public function down() {
        $sql = "ALTER TABLE updates MODIFY COLUMN assets_file VARCHAR(500) DEFAULT NULL";
        
        try {
            $this->conn->exec($sql);
            echo "Reverted assets_file back to VARCHAR(500).\n";
        } catch(PDOException $e) {
            echo "Error reverting column type: " . $e->getMessage() . "\n";
        }
    }
}
