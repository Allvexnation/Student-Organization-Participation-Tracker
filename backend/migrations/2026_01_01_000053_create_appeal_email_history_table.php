<?php

class Create_appeal_email_history_table {
    private $conn;

    public function __construct() {
        require_once __DIR__ . '/../config/db.php';
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
    }

    public function up() {
        $query = "CREATE TABLE IF NOT EXISTS appeal_email_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            appeal_id INT NOT NULL,
            sent_to VARCHAR(255) NOT NULL,
            subject VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (appeal_id) REFERENCES ban_appeals(id) ON DELETE CASCADE,
            INDEX idx_appeal_id (appeal_id),
            INDEX idx_sent_at (sent_at)
        )";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            echo "Migration: appeal_email_history table created successfully.\n";
            return true;
        } catch(PDOException $e) {
            echo "Migration Error: " . $e->getMessage() . "\n";
            return false;
        }
    }

    public function down() {
        $query = "DROP TABLE IF EXISTS appeal_email_history";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            echo "Migration: appeal_email_history table dropped successfully.\n";
            return true;
        } catch(PDOException $e) {
            echo "Migration Error: " . $e->getMessage() . "\n";
            return false;
        }
    }
}
