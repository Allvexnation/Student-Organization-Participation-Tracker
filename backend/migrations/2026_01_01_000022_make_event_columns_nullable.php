<?php

require_once __DIR__ . '/Migration.php';

class Make_event_columns_nullable extends Migration {
    public function up() {
        $this->conn->exec("ALTER TABLE events MODIFY COLUMN organization_id INT NULL");
        $this->conn->exec("ALTER TABLE events MODIFY COLUMN event_date DATETIME NULL");
        
        echo "Event columns made nullable successfully.\n";
    }

    public function down() {
        $this->conn->exec("ALTER TABLE events MODIFY COLUMN organization_id INT NOT NULL");
        $this->conn->exec("ALTER TABLE events MODIFY COLUMN event_date DATETIME NOT NULL");
        
        echo "Event columns reverted to NOT NULL successfully.\n";
    }
}
