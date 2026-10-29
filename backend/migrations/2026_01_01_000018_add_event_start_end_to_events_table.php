<?php

require_once __DIR__ . '/Migration.php';

class Add_event_start_end_to_events_table extends Migration {
    public function up() {
        $this->addColumn('events', 'event_start DATETIME');
        $this->addColumn('events', 'event_end DATETIME');
        
        echo "Event start and end columns added to events table successfully.\n";
    }

    public function down() {
        $this->dropColumn('events', 'event_start');
        $this->dropColumn('events', 'event_end');
        
        echo "Event start and end columns dropped from events table successfully.\n";
    }
}
