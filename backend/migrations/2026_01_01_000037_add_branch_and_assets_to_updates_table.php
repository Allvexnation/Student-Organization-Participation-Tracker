<?php

require_once __DIR__ . '/Migration.php';

class Add_branch_and_assets_to_updates_table extends Migration {
    public function up() {
        $checkBranch = $this->conn->query("SHOW COLUMNS FROM updates LIKE 'branch'");
        if ($checkBranch->rowCount() == 0) {
            try {
                $this->conn->exec("ALTER TABLE updates ADD COLUMN branch VARCHAR(100) NOT NULL DEFAULT 'main' AFTER name");
                echo "Added branch column to updates table.\n";
            } catch(PDOException $e) {
                echo "Error adding branch column: " . $e->getMessage() . "\n";
            }
        }

        $checkAssets = $this->conn->query("SHOW COLUMNS FROM updates LIKE 'assets'");
        if ($checkAssets->rowCount() == 0) {
            try {
                $this->conn->exec("ALTER TABLE updates ADD COLUMN assets LONGTEXT DEFAULT NULL AFTER readme_filename");
                echo "Added assets column to updates table.\n";
            } catch(PDOException $e) {
                echo "Error adding assets column: " . $e->getMessage() . "\n";
            }
        }

        $checkIsUpdated = $this->conn->query("SHOW COLUMNS FROM updates LIKE 'is_updated'");
        if ($checkIsUpdated->rowCount() == 0) {
            try {
                $this->conn->exec("ALTER TABLE updates ADD COLUMN is_updated TINYINT(1) NOT NULL DEFAULT 0 AFTER assets");
                echo "Added is_updated column to updates table.\n";
            } catch(PDOException $e) {
                echo "Error adding is_updated column: " . $e->getMessage() . "\n";
            }
        }

        echo "Migration Add_branch_and_assets_to_updates_table completed successfully.\n";
    }

    public function down() {
        try {
            $this->conn->exec("ALTER TABLE updates DROP COLUMN branch");
            echo "Dropped branch column.\n";
        } catch(PDOException $e) {}

        try {
            $this->conn->exec("ALTER TABLE updates DROP COLUMN assets");
            echo "Dropped assets column.\n";
        } catch(PDOException $e) {}

        try {
            $this->conn->exec("ALTER TABLE updates DROP COLUMN is_updated");
            echo "Dropped is_updated column.\n";
        } catch(PDOException $e) {}

        echo "Reverted Add_branch_and_assets_to_updates_table.\n";
    }
}

