<?php

require_once __DIR__ . '/Migration.php';

class Add_current_organization_id_to_advisers_table extends Migration {
    public function up() {
        $this->addColumn('advisers', 'current_organization_id INT DEFAULT NULL AFTER status');
        
        $this->addForeignKey('advisers', 'current_organization_id', 'organizations', 'id', 'SET NULL');
        
        echo "Advisers table altered successfully - added current_organization_id.\n";
    }

    public function down() {
        $this->dropForeignKey('advisers', 'current_organization_id');
        
        $this->dropColumn('advisers', 'current_organization_id');
        
        echo "Advisers table reverted successfully - removed current_organization_id.\n";
    }
}
