<?php

require_once __DIR__ . '/Migration.php';

class Add_role_id_to_organization_memberships_table extends Migration {
    public function up() {
        $this->addColumn('organization_memberships', 'role_id INT NULL AFTER position');
        
        $this->addForeignKey('organization_memberships', 'role_id', 'roles', 'id', 'SET NULL');
        
        echo "role_id column added to organization_memberships table successfully.\n";
    }

    public function down() {
        $this->dropForeignKey('organization_memberships', 'role_id');
        
        $this->dropColumn('organization_memberships', 'role_id');
        
        echo "role_id column removed from organization_memberships table successfully.\n";
    }
}
