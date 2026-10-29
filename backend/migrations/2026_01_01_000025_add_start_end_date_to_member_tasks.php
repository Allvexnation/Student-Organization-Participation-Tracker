<?php

require_once __DIR__ . '/Migration.php';

class Add_start_end_date_to_member_tasks extends Migration {
    public function up() {
        $this->addColumn('member_tasks', 'start_date DATE AFTER task_description');
        $this->addColumn('member_tasks', 'end_date DATE AFTER start_date');
        
        echo "Start date and end date columns added to member_tasks table successfully.\n";
    }

    public function down() {
        $this->dropColumn('member_tasks', 'start_date');
        $this->dropColumn('member_tasks', 'end_date');
        
        echo "Start date and end date columns dropped from member_tasks table successfully.\n";
    }
}
