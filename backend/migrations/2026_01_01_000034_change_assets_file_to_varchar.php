<?php

require_once __DIR__ . '/Migration.php';

class Change_assets_file_to_varchar extends Migration {
    public function up() {
        $sql = "ALTER TABLE updates MODIFY COLUMN assets_file VARCHAR(500) DEFAULT NULL";
        
        try {
            $this->conn->exec($sql);
            echo "Changed assets_file from LONGBLOB to VARCHAR for Cloudinary URLs.\n";
        } catch(PDOException $e) {
            echo "Error changing column type: " . $e->getMessage() . "\n";
            $this->dropColumn('updates', 'assets_file');
            $this->addColumn('updates', 'assets_file VARCHAR(500) DEFAULT NULL AFTER assets');
            echo "Changed assets_file using drop/add method.\n";
        }
    }

    public function down() {
        $sql = "ALTER TABLE updates MODIFY COLUMN assets_file LONGBLOB DEFAULT NULL";
        
        try {
            $this->conn->exec($sql);
            echo "Reverted assets_file back to LONGBLOB.\n";
        } catch(PDOException $e) {
            echo "Error reverting column type: " . $e->getMessage() . "\n";
            $this->dropColumn('updates', 'assets_file');
            $this->addColumn('updates', 'assets_file LONGBLOB DEFAULT NULL AFTER assets');
            echo "Reverted assets_file using drop/add method.\n";
        }
    }
}
