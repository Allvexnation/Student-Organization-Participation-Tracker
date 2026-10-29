<?php

require_once __DIR__ . '/Migration.php';

class Add_event_id_to_member_tasks extends Migration {
    public function up() {
        $this->addColumn('member_tasks', 'event_id INT NOT NULL AFTER id');
        $this->addForeignKey('member_tasks', 'event_id', 'events', 'id', 'CASCADE');
        
        echo "Event ID column added to member_tasks table successfully.\n";
    }

    public function down() {
        $this->dropForeignKey('member_tasks', 'event_id');
        $this->dropColumn('member_tasks', 'event_id');
        
        echo "Event ID column removed from member_tasks table successfully.\n";
    }
}
