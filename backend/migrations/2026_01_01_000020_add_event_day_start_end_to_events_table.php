<?php

require_once __DIR__ . '/Migration.php';

class Add_event_day_start_end_to_events_table extends Migration {
    public function up() {
        $this->addColumn('events', 'event_day_start DATE');
        $this->addColumn('events', 'event_day_end DATE');
        
        echo "Event day start and end columns added to events table successfully.\n";
    }

    public function down() {
        $this->dropColumn('events', 'event_day_start');
        $this->dropColumn('events', 'event_day_end');
        
        echo "Event day start and end columns dropped from events table successfully.\n";
    }
}
