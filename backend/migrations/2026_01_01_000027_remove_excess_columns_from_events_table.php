<?php

require_once __DIR__ . '/Migration.php';

class Remove_excess_columns_from_events_table extends Migration {
    public function up() {
        try {
            $this->dropForeignKey('events', 'organization_id');
        } catch (PDOException $e) {

        }
        
        $this->dropColumn('events', 'event_date');
        $this->dropColumn('events', 'event_start');
        $this->dropColumn('events', 'event_end');
        $this->dropColumn('events', 'organization_id');
        
        echo "Excess columns removed from events table successfully.\n";
    }

    public function down() {

        if (!$this->columnExists('events', 'event_date')) {
            $this->addColumn('events', 'event_date DATETIME');
        }
        
        if (!$this->columnExists('events', 'event_start')) {
            $this->addColumn('events', 'event_start DATETIME');
        }
        
        if (!$this->columnExists('events', 'event_end')) {
            $this->addColumn('events', 'event_end DATETIME');
        }
        
        if (!$this->columnExists('events', 'organization_id')) {
            $this->addColumn('events', 'organization_id INT');
            $this->addForeignKey('events', 'organization_id', 'organizations', 'id', 'CASCADE');
        }
        
        echo "Excess columns restored to events table successfully.\n";
    }
}
