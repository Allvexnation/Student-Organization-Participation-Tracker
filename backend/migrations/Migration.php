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

            $indexName = "{$column}";
            $sql = "ALTER TABLE {$tableName} DROP INDEX {$indexName}";
            try {
                $this->conn->exec($sql);
            } catch(PDOException $e) {

            }
            return true;
        } catch(PDOException $e) {

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
                    $indexName = "{$column}";
                    $sql = "ALTER TABLE {$tableName} DROP INDEX {$indexName}";
                    try {
                        $this->conn->exec($sql);
                    } catch(PDOException $e2) {

                    }
                    return true;
                }
            } catch(PDOException $e2) {

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

    public static function create($migrationName) {

        $timestamp = date('Y_m_d_His');
        
        $className = str_replace(' ', '_', ucwords(str_replace('_', ' ', $migrationName)));

        $filename = "{$timestamp}_{$migrationName}.php";
        $filepath = __DIR__ . '/' . $filename;

        $template = <<<PHP
<?php

require_once __DIR__ . '/Migration.php';

class {$className} extends Migration {
    public function up() {
        // Define your table columns here
        \$columns = [
            // 'id INT AUTO_INCREMENT PRIMARY KEY',
            // 'name VARCHAR(255) NOT NULL',
            // 'email VARCHAR(255) NOT NULL UNIQUE',
            // 'created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            // 'updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
        ];
        
        // Create your table
        // \$this->createTable('table_name', \$columns);
        
        echo "Migration completed.\n";
    }

    public function down() {
        // Rollback your changes here
        // \$this->dropTable('table_name');
        
        echo "Rollback completed.\n";
    }
}
PHP;


        if (file_put_contents($filepath, $template)) {
            echo "Migration created successfully: {$filename}\n";
            echo "Class name: {$className}\n";
            echo "Location: {$filepath}\n";
            return $filepath;
        } else {
            echo "Error: Failed to create migration file\n";
            return false;
        }
    }


    public static function cli() {
        global $argv;
        
        if (count($argv) < 3) {
            echo "Usage: php Migration.php make:migration <migration_name>\n";
            echo "Example: php Migration.php make:migration create_users_table\n";
            exit(1);
        }
        
        $command = $argv[1];
        $migrationName = $argv[2];
        
        if ($command === 'make:migration') {
            self::create($migrationName);
        } else {
            echo "Unknown command: {$command}\n";
            echo "Available commands:\n";
            echo "  make:migration <name>  Create a new migration file\n";
            exit(1);
        }
    }
}

if (php_sapi_name() === 'cli' && isset($argv[0]) && basename(__FILE__) === basename($argv[0])) {
    Migration::cli();
}
