<?php

require_once __DIR__ . '/Migration.php';

class Remove_organization_id_from_events_table extends Migration {
    public function up() {
        try {
            $this->dropForeignKey('events', 'organization_id');
        } catch (PDOException $e) {

        }

        if ($this->columnExists('events', 'organization_id')) {
            $this->dropColumn('events', 'organization_id');
        }

        echo "Organization_id column removed from events table successfully.\n";
    }

    public function down() {
        if (!$this->columnExists('events', 'organization_id')) {
            $this->addColumn('events', 'organization_id INT NULL');
            $this->addForeignKey('events', 'organization_id', 'organizations', 'id', 'CASCADE');
        }

        echo "Organization_id column restored to events table successfully.\n";
    }
}

