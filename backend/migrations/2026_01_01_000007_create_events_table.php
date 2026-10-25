<?php

require_once __DIR__ . '/Migration.php';

class Create_events_table extends Migration {
    public function up() {
        $columns = [
            'id INT AUTO_INCREMENT PRIMARY KEY',
            'organization_id INT NOT NULL',
            'title VARCHAR(255) NOT NULL',
            'description TEXT',
            'event_date DATETIME NOT NULL',
            'venue VARCHAR(255)',
            'event_category VARCHAR(50) NOT NULL',
            'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE'
        ];
        
        $this->createTable('events', $columns);
        
        echo "Events table created successfully.\n";
    }

    public function down() {
        $this->dropTable('events');
        echo "Events table dropped successfully.\n";
    }
}
