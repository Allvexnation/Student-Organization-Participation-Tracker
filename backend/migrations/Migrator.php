<?php

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/Migration.php';

class Migrator {
    private $conn;
    private $database = "student_organization_tracker";
    private $migrationsPath;
    private $migrationsTable = "migrations";

    public function __construct($migrationsPath = null) {
        $db = new Database();
        $this->database = $db->getDatabaseName();
        $this->migrationsPath = $migrationsPath ?: __DIR__;
        
        $this->conn = $db->getConnection(true);
        $this->createDatabase();
        
        $this->conn = $db->getConnection(false);
        $this->createMigrationsTable();
    }

    private function createDatabase() {
        try {
            $this->conn->exec("CREATE DATABASE IF NOT EXISTS " . $this->database);
            echo "Database created or already exists.\n";
        } catch(PDOException $e) {
            echo "Error creating database: " . $e->getMessage() . "\n";
        }
    }

    private function createMigrationsTable() {
        $sql = "CREATE TABLE IF NOT EXISTS {$this->migrationsTable} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            migration VARCHAR(255) NOT NULL UNIQUE,
            batch INT NOT NULL,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )";

        try {
            $this->conn->exec($sql);
        } catch(PDOException $e) {
            echo "Error creating migrations table: " . $e->getMessage() . "\n";
        }
    }

    private function getMigrations() {
        $migrations = [];
        $files = glob($this->migrationsPath . '/*.php');
        
        foreach ($files as $file) {
            $filename = basename($file, '.php');
            if ($filename !== 'Migration' && $filename !== 'Migrator') {
                $className = preg_replace('/^\d+_\d+_\d+_\d+_/', '', $filename);
                $migrations[$filename] = ['file' => $file, 'class' => $className];
            }
        }
        
        ksort($migrations);
        return $migrations;
    }

    private function getRanMigrations() {
        $sql = "SELECT migration FROM {$this->migrationsTable} ORDER BY batch, migration";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        
        $ran = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $ran[] = $row['migration'];
        }
        
        return $ran;
    }

    private function getBatchNumber() {
        $sql = "SELECT MAX(batch) as batch FROM {$this->migrationsTable}";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result['batch'] ? $result['batch'] + 1 : 1;
    }

    private function logMigration($migrationName, $batch) {
        $sql = "INSERT INTO {$this->migrationsTable} (migration, batch) VALUES (:migration, :batch)";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':migration', $migrationName);
        $stmt->bindParam(':batch', $batch);
        
        try {
            $stmt->execute();
        } catch(PDOException $e) {
            echo "Error logging migration: " . $e->getMessage() . "\n";
        }
    }

    public function migrate() {
        $migrations = $this->getMigrations();
        $ran = $this->getRanMigrations();
        $batch = $this->getBatchNumber();
        
        $pending = array_diff(array_keys($migrations), $ran);
        
        if (empty($pending)) {
            echo "Nothing to migrate.\n";
            return;
        }

        echo "Running migrations...\n";
        
        foreach ($pending as $migrationName) {
            $migrationData = $migrations[$migrationName];
            $file = $migrationData['file'];
            $className = $migrationData['class'];
            
            require_once $file;
            
            if (class_exists($className)) {
                $migration = new $className($this->conn);
                
                echo "Migrating: {$migrationName}\n";
                
                try {
                    $migration->up();
                    $this->logMigration($migrationName, $batch);
                    echo "Migrated: {$migrationName}\n";
                } catch(Exception $e) {
                    echo "Error migrating {$migrationName}: " . $e->getMessage() . "\n";
                    return;
                }
            }
        }
        
        echo "\nMigration completed successfully!\n";
    }

    public function rollback($steps = 1) {
        $ran = $this->getRanMigrations();
        $batch = $this->getBatchNumber() - 1;
        
        if ($batch < 1) {
            echo "Nothing to rollback.\n";
            return;
        }

        $sql = "SELECT migration FROM {$this->migrationsTable} WHERE batch = :batch ORDER BY migration DESC";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':batch', $batch);
        $stmt->execute();
        
        $toRollback = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $toRollback[] = $row['migration'];
        }
        
        if (empty($toRollback)) {
            echo "Nothing to rollback.\n";
            return;
        }

        echo "Rolling back migrations...\n";
        
        foreach ($toRollback as $migrationName) {
            $file = $this->migrationsPath . '/' . $migrationName . '.php';
            
            if (file_exists($file)) {
                require_once $file;
                $className = preg_replace('/^\d+_\d+_\d+_\d+_/', '', $migrationName);
                
                if (class_exists($className)) {
                    $migration = new $className($this->conn);
                    
                    echo "Rolling back: {$migrationName}\n";
                    
                    try {
                        $migration->down();
                        
                        $deleteSql = "DELETE FROM {$this->migrationsTable} WHERE migration = :migration";
                        $deleteStmt = $this->conn->prepare($deleteSql);
                        $deleteStmt->bindParam(':migration', $migrationName);
                        $deleteStmt->execute();
                        
                        echo "Rolled back: {$migrationName}\n";
                    } catch(Exception $e) {
                        echo "Error rolling back {$migrationName}: " . $e->getMessage() . "\n";
                        return;
                    }
                }
            }
        }
        
        echo "\nRollback completed successfully!\n";
    }

    public function reset() {
        $ran = $this->getRanMigrations();
        
        if (empty($ran)) {
            echo "Nothing to reset.\n";
            return;
        }

        echo "Resetting database...\n";
        
        foreach (array_reverse($ran) as $migrationName) {
            $file = $this->migrationsPath . '/' . $migrationName . '.php';
            
            if (file_exists($file)) {
                require_once $file;
                $className = preg_replace('/^\d+_\d+_\d+_\d+_/', '', $migrationName);
                
                if (class_exists($className)) {
                    $migration = new $className($this->conn);
                    
                    echo "Rolling back: {$migrationName}\n";
                    
                    try {
                        $migration->down();
                        echo "Rolled back: {$migrationName}\n";
                    } catch(Exception $e) {
                        echo "Error rolling back {$migrationName}: " . $e->getMessage() . "\n";
                        return;
                    }
                }
            }
        }
        
        $this->conn->exec("TRUNCATE TABLE {$this->migrationsTable}");
        
        echo "\nDatabase reset completed successfully!\n";
    }

    public function status() {
        $migrations = $this->getMigrations();
        $ran = $this->getRanMigrations();
        
        echo "\nMigration Status:\n";
        echo str_repeat("-", 50) . "\n";
        
        foreach ($migrations as $name => $data) {
            $status = in_array($name, $ran) ? "[X]" : "[ ]";
            echo "{$status} {$name}\n";
        }
        
        echo str_repeat("-", 50) . "\n";
    }
}
