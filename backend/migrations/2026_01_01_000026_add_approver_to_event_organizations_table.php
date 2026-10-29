<?php

require_once __DIR__ . '/Migration.php';

class Add_approver_to_event_organizations_table extends Migration {
    public function up() {
        $this->addColumn('event_organizations', 'approver_id INT DEFAULT NULL');
        $this->addColumn('event_organizations', 'registered_at TIMESTAMP NULL');
        $this->addColumn('event_organizations', 'status VARCHAR(20) DEFAULT \'pending\'');
        $this->addForeignKey('event_organizations', 'approver_id', 'advisers', 'id', 'SET NULL');
        
        echo "Approver fields added to event_organizations table successfully.\n";
    }

    public function down() {
        $this->dropForeignKey('event_organizations', 'approver_id');
        $this->dropColumn('event_organizations', 'approver_id');
        $this->dropColumn('event_organizations', 'registered_at');
        $this->dropColumn('event_organizations', 'status');
        
        echo "Approver fields dropped from event_organizations table successfully.\n";
    }
}
