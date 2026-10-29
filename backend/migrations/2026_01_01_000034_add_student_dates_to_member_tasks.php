<?php

require_once __DIR__ . '/Migration.php';

class Add_student_dates_to_member_tasks extends Migration {
    public function up() {
        $this->addColumn('member_tasks', 'student_start_date DATE DEFAULT NULL AFTER end_date');
        $this->addColumn('member_tasks', 'student_end_date DATE DEFAULT NULL AFTER student_start_date');
        echo "Student start and end date columns added to member_tasks table successfully.\n";
    }

    public function down() {
        $this->dropColumn('member_tasks', 'student_end_date');
        $this->dropColumn('member_tasks', 'student_start_date');
        echo "Student start and end date columns dropped from member_tasks table successfully.\n";
    }
}
