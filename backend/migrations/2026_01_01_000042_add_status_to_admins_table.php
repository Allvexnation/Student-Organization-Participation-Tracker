<?php

require_once __DIR__ . '/Migration.php';

class Add_status_to_admins_table extends Migration {
    public function up() {
        $this->addColumn('admins', "status VARCHAR(50) DEFAULT 'active'");
        echo "Status column added to admins table successfully.\n";
    }

    public function down() {
        $this->dropColumn('admins', 'status');
        echo "Status column dropped from admins table successfully.\n";
    }
}
