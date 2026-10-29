<?php

abstract class Migration {
    protected $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    abstract public function up();
    abstract public function down();

    protected function createTable($tableName, $columns) {
        if (is_callable($columns)) {
            $tempColumns = [];
            $columns($tempColumns);
            $columns = $tempColumns;
        }
        
        if (empty($columns)) {
            echo "Error creating table {$tableName}: No columns defined\n";
            return false;
        }
        
        $sql = "CREATE TABLE IF NOT EXISTS {$tableName} (";
        $sql .= implode(", ", $columns);
        $sql .= ")";
        
        try {
            $this->conn->exec($sql);
            return true;
        } catch(PDOException $e) {
            echo "Error creating table {$tableName}: " . $e->getMessage() . "\n";
            echo "SQL: {$sql}\n";
            return false;
        }
    }

    protected function dropTable($tableName) {
        $sql = "DROP TABLE IF EXISTS {$tableName}";
        
        try {
            $this->conn->exec($sql);
            return true;
        } catch(PDOException $e) {
            echo "Error dropping table {$tableName}: " . $e->getMessage() . "\n";
            return false;
        }
    }

    protected function addColumn($tableName, $columnDefinition) {
        $sql = "ALTER TABLE {$tableName} ADD COLUMN {$columnDefinition}";
        
        try {
            $this->conn->exec($sql);
            return true;
        } catch(PDOException $e) {
            echo "Error adding column to table {$tableName}: " . $e->getMessage() . "\n";
            echo "SQL: {$sql}\n";
            return false;
        }
    }

    protected function dropColumn($tableName, $columnName) {
        $sql = "ALTER TABLE {$tableName} DROP COLUMN {$columnName}";
        
        try {
            $this->conn->exec($sql);
            return true;
        } catch(PDOException $e) {
            echo "Error dropping column from table {$tableName}: " . $e->getMessage() . "\n";
            echo "SQL: {$sql}\n";
            return false;
        }
    }

    protected function addForeignKey($tableName, $column, $referencedTable, $referencedColumn, $onDelete = 'CASCADE') {
        $constraintName = "fk_{$tableName}_{$column}";
        $sql = "ALTER TABLE {$tableName} ADD CONSTRAINT {$constraintName} 
                FOREIGN KEY ({$column}) REFERENCES {$referencedTable}({$referencedColumn}) 
                ON DELETE {$onDelete}";
        
        try {
            $this->conn->exec($sql);
            return true;
        } catch(PDOException $e) {
            echo "Error adding foreign key to table {$tableName}: " . $e->getMessage() . "\n";
            echo "SQL: {$sql}\n";
            return false;
        }
    }

    protected function dropForeignKey($tableName, $column) {
        $constraintName = "fk_{$tableName}_{$column}";
        $sql = "ALTER TABLE {$tableName} DROP FOREIGN KEY {$constraintName}";
        
        try {
            $this->conn->exec($sql);
            // Also drop the index if it exists
            $indexName = "{$column}";
            $sql = "ALTER TABLE {$tableName} DROP INDEX {$indexName}";
            try {
                $this->conn->exec($sql);
            } catch(PDOException $e) {
                // Index might not exist, ignore
            }
            return true;
        } catch(PDOException $e) {
            // Try to find the actual constraint name
            $sql = "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE 
                     WHERE TABLE_NAME = '{$tableName}' 
                     AND COLUMN_NAME = '{$column}' 
                     AND REFERENCED_TABLE_NAME IS NOT NULL";
            try {
                $stmt = $this->conn->query($sql);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($result && isset($result['CONSTRAINT_NAME'])) {
                    $actualConstraintName = $result['CONSTRAINT_NAME'];
                    $sql = "ALTER TABLE {$tableName} DROP FOREIGN KEY {$actualConstraintName}";
                    $this->conn->exec($sql);
                    // Also drop the index
                    $indexName = "{$column}";
                    $sql = "ALTER TABLE {$tableName} DROP INDEX {$indexName}";
                    try {
                        $this->conn->exec($sql);
                    } catch(PDOException $e2) {
                        // Index might not exist, ignore
                    }
                    return true;
                }
            } catch(PDOException $e2) {
                // Ignore
            }
            echo "Error dropping foreign key from table {$tableName}: " . $e->getMessage() . "\n";
            echo "SQL: {$sql}\n";
            return false;
        }
    }

    protected function columnExists($tableName, $columnName) {
        $sql = "SHOW COLUMNS FROM {$tableName} LIKE '{$columnName}'";
        try {
            $stmt = $this->conn->query($sql);
            return $stmt->rowCount() > 0;
        } catch(PDOException $e) {
            return false;
        }
    }
}
