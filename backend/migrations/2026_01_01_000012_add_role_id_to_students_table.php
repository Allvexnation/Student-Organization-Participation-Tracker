<?php

require_once __DIR__ . '/Migration.php';

class Add_role_id_to_students_table extends Migration {
    public function up() {
        $this->addColumn('students', 'role_id INT NULL AFTER password');
        
        $this->addForeignKey('students', 'role_id', 'roles', 'id', 'SET NULL');
        
        echo "role_id column added to students table successfully.\n";
    }

    public function down() {
        $this->dropForeignKey('students', 'role_id');
        
        $this->dropColumn('students', 'role_id');
        
        echo "role_id column removed from students table successfully.\n";
    }
}
