<?php

require_once __DIR__ . '/Migration.php';

class Add_task_title_to_member_tasks extends Migration {
    public function up() {
        $this->addColumn('member_tasks', 'task_title VARCHAR(255) DEFAULT NULL AFTER task_description');
        echo "Task title column added to member_tasks table successfully.\n";
    }

    public function down() {
        $this->dropColumn('member_tasks', 'task_title');
        echo "Task title column dropped from member_tasks table successfully.\n";
    }
}
