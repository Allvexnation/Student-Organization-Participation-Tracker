<?php

require_once __DIR__ . '/Migration.php';

class Drop_position_from_organization_memberships_table extends Migration {
    public function up() {
        $this->dropColumn('organization_memberships', 'position');
        
        echo "position column dropped from organization_memberships table successfully.\n";
    }

    public function down() {
        $this->addColumn('organization_memberships', 'position VARCHAR(100) NOT NULL AFTER date_joined');
        
        echo "position column re-added to organization_memberships table successfully.\n";
    }
}
