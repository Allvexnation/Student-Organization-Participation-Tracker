<?php

require_once __DIR__ . '/Migration.php';

class Add_assets_file_to_updates extends Migration {
    public function up() {
        $this->addColumn('updates', 'assets_file LONGBLOB DEFAULT NULL AFTER assets');
        echo "Added assets_file column to updates table.\n";
    }

    public function down() {
        $this->dropColumn('updates', 'assets_file');
        echo "Dropped assets_file column from updates table.\n";
    }
}
