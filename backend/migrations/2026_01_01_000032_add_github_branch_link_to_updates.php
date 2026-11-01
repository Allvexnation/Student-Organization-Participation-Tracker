<?php

require_once __DIR__ . '/Migration.php';

class Add_github_branch_link_to_updates extends Migration {
    public function up() {
        $this->addColumn('updates', 'github_branch_link VARCHAR(500) DEFAULT NULL AFTER branch');
        echo "Added github_branch_link column to updates table.\n";
    }

    public function down() {
        $this->dropColumn('updates', 'github_branch_link');
        echo "Dropped github_branch_link column from updates table.\n";
    }
}
