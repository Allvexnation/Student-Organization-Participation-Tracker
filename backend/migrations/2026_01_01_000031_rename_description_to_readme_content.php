<?php

require_once __DIR__ . '/Migration.php';

class Rename_description_to_readme_content extends Migration {
    public function up() {

        $checkColumn = $this->conn->query("SHOW COLUMNS FROM updates LIKE 'readme_content'");
        
        if ($checkColumn->rowCount() == 0) {

            try {
                $this->conn->exec("ALTER TABLE updates ADD COLUMN readme_content LONGTEXT NOT NULL AFTER name");
                echo "Added readme_content column.\n";
            } catch(PDOException $e) {
                echo "Error adding readme_content column: " . $e->getMessage() . "\n";
            }
        }

        $checkFilename = $this->conn->query("SHOW COLUMNS FROM updates LIKE 'readme_filename'");
        
        if ($checkFilename->rowCount() == 0) {

            try {
                $this->conn->exec("ALTER TABLE updates ADD COLUMN readme_filename VARCHAR(255) DEFAULT NULL AFTER readme_content");
                echo "Added readme_filename column.\n";
            } catch(PDOException $e) {
                echo "Error adding readme_filename column: " . $e->getMessage() . "\n";
            }
        }

        $checkDescription = $this->conn->query("SHOW COLUMNS FROM updates LIKE 'description'");
        
        if ($checkDescription->rowCount() > 0) {
            try {
                $this->conn->exec("UPDATE updates SET readme_content = description WHERE readme_content IS NULL OR readme_content = ''");
                echo "Copied data from description to readme_content.\n";

                try {
                    $this->conn->exec("ALTER TABLE updates DROP COLUMN description");
                    echo "Dropped description column.\n";
                } catch(PDOException $e) {
                    echo "Error dropping description column: " . $e->getMessage() . "\n";
                }
            } catch(PDOException $e) {
                echo "Error copying data: " . $e->getMessage() . "\n";
            }
        }

        echo "Successfully renamed description to readme_content and added readme_filename.\n";
    }

    public function down() {
        $checkDescription = $this->conn->query("SHOW COLUMNS FROM updates LIKE 'description'");
        
        if ($checkDescription->rowCount() == 0) {
            try {
                $this->conn->exec("ALTER TABLE updates ADD COLUMN description TEXT NOT NULL AFTER name");
                echo "Added description column back.\n";
            } catch(PDOException $e) {
                echo "Error adding description column: " . $e->getMessage() . "\n";
            }
        }

        try {
            $this->conn->exec("UPDATE updates SET description = readme_content WHERE description IS NULL OR description = ''");
            echo "Copied data back to description.\n";
        } catch(PDOException $e) {
            echo "Error copying data back: " . $e->getMessage() . "\n";
        }

        try {
            $this->conn->exec("ALTER TABLE updates DROP COLUMN readme_content");
            echo "Dropped readme_content column.\n";
        } catch(PDOException $e) {
            echo "Error dropping readme_content column: " . $e->getMessage() . "\n";
        }

        try {
            $this->conn->exec("ALTER TABLE updates DROP COLUMN readme_filename");
            echo "Dropped readme_filename column.\n";
        } catch(PDOException $e) {
            echo "Error dropping readme_filename column: " . $e->getMessage() . "\n";
        }

        echo "Successfully reverted changes.\n";
    }
}
