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

    protected function addColumn($columns, $definition) {
        $columns[] = $definition;
    }
}
