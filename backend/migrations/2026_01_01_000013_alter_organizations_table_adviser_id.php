<?php

require_once __DIR__ . '/Migration.php';

class Alter_organizations_table_adviser_id extends Migration {
    public function up() {

        $this->addColumn('organizations', 'adviser_id INT DEFAULT NULL AFTER description');
        
        $this->dropColumn('organizations', 'adviser');
        
        $this->addForeignKey('organizations', 'adviser_id', 'advisers', 'id', 'SET NULL');
        
        echo "Organizations table altered successfully - adviser column changed to adviser_id.\n";
    }

    public function down() {

        $this->dropForeignKey('organizations', 'adviser_id');

        $this->dropColumn('organizations', 'adviser_id');

        $this->addColumn('organizations', 'adviser VARCHAR(255) AFTER description');
        
        echo "Organizations table reverted successfully.\n";
    }
}
