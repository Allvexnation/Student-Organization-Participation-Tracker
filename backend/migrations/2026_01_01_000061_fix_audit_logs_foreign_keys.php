<?php

require_once __DIR__ . '/Migration.php';

class Fix_audit_logs_foreign_keys extends Migration {
    public function up() {
        $this->dropForeignKeyIfExists('audit_logs', 'fk_audit_logs_student');
        $this->dropForeignKeyIfExists('audit_logs', 'fk_audit_logs_adviser');

        try {
            $this->conn->exec("ALTER TABLE audit_logs
                ADD CONSTRAINT fk_audit_logs_admin
                FOREIGN KEY (user_id) REFERENCES admins(id)
                ON DELETE CASCADE");
        } catch (PDOException $e) {
            echo "Foreign key fk_audit_logs_admin may already exist: " . $e->getMessage() . "\n";
        }

        echo "Audit logs foreign keys updated to reference admins only.\n";
    }

    public function down() {
        try {
            $this->conn->exec("ALTER TABLE audit_logs
                ADD CONSTRAINT fk_audit_logs_adviser
                FOREIGN KEY (user_id) REFERENCES advisers(id)
                ON DELETE CASCADE");
        } catch (PDOException $e) {
            echo "Could not restore fk_audit_logs_adviser: " . $e->getMessage() . "\n";
        }

        try {
            $this->conn->exec("ALTER TABLE audit_logs
                ADD CONSTRAINT fk_audit_logs_student
                FOREIGN KEY (user_id) REFERENCES students(id)
                ON DELETE CASCADE");
        } catch (PDOException $e) {
            echo "Could not restore fk_audit_logs_student: " . $e->getMessage() . "\n";
        }

        echo "Audit logs foreign keys rollback attempted.\n";
    }

    private function dropForeignKeyIfExists($tableName, $constraintName) {
        $sql = "SELECT CONSTRAINT_NAME
                FROM information_schema.TABLE_CONSTRAINTS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = :table_name
                  AND CONSTRAINT_NAME = :constraint_name
                  AND CONSTRAINT_TYPE = 'FOREIGN KEY'
                LIMIT 1";

        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':table_name', $tableName);
        $stmt->bindParam(':constraint_name', $constraintName);
        $stmt->execute();

        if (!$stmt->fetch(PDO::FETCH_ASSOC)) {
            echo "Constraint {$constraintName} does not exist on {$tableName}.\n";
            return;
        }

        try {
            $this->conn->exec("ALTER TABLE {$tableName} DROP FOREIGN KEY {$constraintName}");
            echo "Dropped foreign key {$constraintName} from {$tableName}.\n";
        } catch (PDOException $e) {
            echo "Error dropping foreign key {$constraintName}: " . $e->getMessage() . "\n";
        }
    }
}
