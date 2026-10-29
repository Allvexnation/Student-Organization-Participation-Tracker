<?php

require_once __DIR__ . '/Migration.php';

class Add_organization_id_to_events_table extends Migration {
    public function up() {
        
        $this->addColumn('events', 'organization_id INT');

        $this->addForeignKey('events', 'organization_id', 'organizations', 'id', 'CASCADE');
        
        echo "Organization_id column and foreign key added to events table successfully.\n";
    }

    public function down() {

        try {
            $this->dropForeignKey('events', 'organization_id');
        } catch (PDOException $e) {

        }

        if ($this->columnExists('events', 'organization_id')) {
            $this->dropColumn('events', 'organization_id');
        }
        
        echo "Organization_id column and foreign key removed from events table successfully.\n";
    }
}
