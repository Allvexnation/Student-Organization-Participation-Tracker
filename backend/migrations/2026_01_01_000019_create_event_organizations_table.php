<?php

require_once __DIR__ . '/Migration.php';

class Create_event_organizations_table extends Migration {
    public function up() {
        $columns = [
            'id INT AUTO_INCREMENT PRIMARY KEY',
            'event_id INT NOT NULL',
            'organization_id INT NOT NULL',
            'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE',
            'FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE',
            'UNIQUE KEY unique_event_organization (event_id, organization_id)'
        ];
        
        $this->createTable('event_organizations', $columns);
        
        echo "Event organizations table created successfully.\n";
    }

    public function down() {
        $this->dropTable('event_organizations');
        echo "Event organizations table dropped successfully.\n";
    }
}
