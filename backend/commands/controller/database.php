<?php

function showDatabaseSummary($backendDir) {
    require_once __DIR__ . '/../components/loading.php';
    echo "\n";
    echo "\033[1;34m--- Database Summary ---\033[0m\n";
    
    require_once $backendDir . '/config/db.php';
    require_once $backendDir . '/config/env.php';
    loadEnv($backendDir . '/../.env');
    
    echo "\033[1;34mSelect database environment:\033[0m\n";
    echo "  \033[0;33m1.\033[0m Development\n";
    echo "  \033[0;33m2.\033[0m Production\n";
    echo "\033[1;34mChoice:\033[0m ";
    
    $choice = trim(fgets(STDIN));
    
    $env = 'Development';
    if ($choice === '2') {
        $env = 'Production';
    }

    $db = Database::getInstance();
    $conn = $db->getConnection();
    $dbName = $db->getDatabaseName();
    $health = $db->getHealthStatus();
    
    echo "\n";
    echo "\033[1;34m╔════════════════════════════════════════════════════════════╗\033[0m\n";
    echo "\033[1;34m║\033[0m              \033[1;33mDatabase Summary - {$env}\033[0m                 \033[1;34m║\033[0m\n";
    echo "\033[1;34m╚════════════════════════════════════════════════════════════╝\033[0m\n";
    echo "\n";
    echo "\033[0;34mDatabase Name:\033[0m \033[1;33m{$dbName}\033[0m\n";
    echo "\033[0;34mEnvironment:\033[0m \033[1;33m{$env}\033[0m\n";
    
    if ($health['status'] === 'healthy') {
        echo "\033[0;34mHealth Status:\033[0m \033[0;32m● Healthy\033[0m\n";
        echo "\033[0;34mMySQL Version:\033[0m \033[1;33m{$health['version']}\033[0m\n";
        echo "\033[0;34mDatabase Size:\033[0m \033[1;33m{$health['size_mb']} MB\033[0m\n";
        echo "\033[0;34mHost:\033[0m \033[1;33m{$health['host']}:{$health['port']}\033[0m\n";
    } else {
        echo "\033[0;34mHealth Status:\033[0m \033[0;31m● Unhealthy\033[0m\n";
        echo "\033[0;34mError:\033[0m \033[0;31m{$health['message']}\033[0m\n";
    }
    echo "\n";

    $sql = "SHOW TABLES";
    $stmt = $conn->query($sql);
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (empty($tables)) {
        showError("No tables found in database.");
        return;
    }
    
    echo "\033[1;34m" . str_repeat("-", 80) . "\033[0m\n";
    echo "\033[1;34m" . sprintf("%-40s %-15s %-20s", "Table Name", "Record Count", "Last Updated") . "\033[0m\n";
    echo "\033[1;34m" . str_repeat("-", 80) . "\033[0m\n";
    
    $totalRecords = 0;
    
    foreach ($tables as $table) {

        $countSql = "SELECT COUNT(*) as count FROM `{$table}`";
        $countStmt = $conn->query($countSql);
        $count = $countStmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        $totalRecords += $count;

        $lastUpdated = "N/A";
        $columnsSql = "SHOW COLUMNS FROM `{$table}` LIKE '%updated_at%'";
        $columnsStmt = $conn->query($columnsSql);
        if ($columnsStmt->rowCount() > 0) {
            $dateSql = "SELECT MAX(updated_at) as last_updated FROM `{$table}`";
            $dateStmt = $conn->query($dateSql);
            $result = $dateStmt->fetch(PDO::FETCH_ASSOC);
            if ($result['last_updated']) {
                $lastUpdated = $result['last_updated'];
            }
        } else {
            $columnsSql = "SHOW COLUMNS FROM `{$table}` LIKE '%created_at%'";
            $columnsStmt = $conn->query($columnsSql);
            if ($columnsStmt->rowCount() > 0) {
                $dateSql = "SELECT MAX(created_at) as last_updated FROM `{$table}`";
                $dateStmt = $conn->query($dateSql);
                $result = $dateStmt->fetch(PDO::FETCH_ASSOC);
                if ($result['last_updated']) {
                    $lastUpdated = $result['last_updated'];
                }
            }
        }
        
        echo sprintf("\033[0;32m%-40s\033[0m \033[0;33m%-15s\033[0m \033[0;34m%-20s\033[0m\n", $table, number_format($count), $lastUpdated);
    }
    
    echo "\033[1;34m" . str_repeat("-", 80) . "\033[0m\n";
    echo "\033[1;33m" . sprintf("%-40s %-15s", "Total Tables: " . count($tables), "Total Records: " . number_format($totalRecords)) . "\033[0m\n";
    echo "\033[1;34m" . str_repeat("-", 80) . "\033[0m\n";
    
    echo "\n";
    echo "\033[1;34mExport Options:\033[0m\n";
    echo "  \033[0;33m1.\033[0m Display SQL queries in terminal\n";
    echo "  \033[0;33m2.\033[0m Export as SQL file\n";
    echo "  \033[0;33m3.\033[0m Export as JSON file\n";
    echo "  \033[0;31m0.\033[0m Skip export\n";
    echo "\033[1;34mChoice:\033[0m ";
    
    $exportChoice = trim(fgets(STDIN));
    
    if ($exportChoice === '0') {
        return;
    }
    
    if (!in_array($exportChoice, ['1', '2', '3'])) {
        showError("Invalid choice.");
        return;
    }
    
    echo "\n";
    echo "\033[1;34mSelect command type:\033[0m\n";
    echo "  \033[0;33m1.\033[0m INSERT (data only)\n";
    echo "  \033[0;33m2.\033[0m SELECT (data queries)\n";
    echo "  \033[0;33m3.\033[0m CREATE TABLE (structure only)\n";
    echo "\033[1;34mChoice:\033[0m ";
    
    $commandChoice = trim(fgets(STDIN));
    
    if (!in_array($commandChoice, ['1', '2', '3'])) {
        showError("Invalid choice.");
        return;
    }
    
    echo "\n";
    echo "\033[1;34mSelect content type:\033[0m\n";
    echo "  \033[0;33m1.\033[0m Table structure (schema)\n";
    echo "  \033[0;33m2.\033[0m Table data\n";
    echo "  \033[0;33m3.\033[0m Both structure and data\n";
    echo "\033[1;34mChoice:\033[0m ";
    
    $contentChoice = trim(fgets(STDIN));
    
    if (!in_array($contentChoice, ['1', '2', '3'])) {
        showError("Invalid choice.");
        return;
    }
    
    echo "\n";
    echo "\033[1;34mSelect tables to export:\033[0m\n";
    echo "  \033[0;33m1.\033[0m All tables\n";
    echo "  \033[0;33m2.\033[0m Select specific tables\n";
    echo "\033[1;34mChoice:\033[0m ";
    
    $tableChoice = trim(fgets(STDIN));
    
    $selectedTables = [];
    
    if ($tableChoice === '1') {
        $selectedTables = $tables;
    } elseif ($tableChoice === '2') {
        echo "\n";
        echo "\033[1;34mAvailable tables:\033[0m\n";
        foreach ($tables as $index => $table) {
            echo "  \033[0;33m" . ($index + 1) . ".\033[0m {$table}\n";
        }
        echo "\n";
        echo "\033[1;34mEnter table numbers separated by commas (e.g., 1,3,5):\033[0m ";
        $input = trim(fgets(STDIN));
        $indices = array_map('trim', explode(',', $input));
        
        foreach ($indices as $index) {
            $idx = (int)$index - 1;
            if (isset($tables[$idx])) {
                $selectedTables[] = $tables[$idx];
            }
        }
        
        if (empty($selectedTables)) {
            showError("No valid tables selected.");
            return;
        }
    } else {
        showError("Invalid choice.");
        return;
    }
    
    $options = [
        'command_type' => $commandChoice,
        'content_type' => $contentChoice
    ];
    
    switch ($exportChoice) {
        case '1':
            exportAsSQLDisplay($conn, $selectedTables, $options);
            break;
        case '2':
            exportAsSQLFile($conn, $selectedTables, $backendDir, $options);
            break;
        case '3':
            exportAsJSONFile($conn, $selectedTables, $backendDir, $options);
            break;
    }
}

function exportAsSQLDisplay($conn, $tables, $options) {
    echo "\n";
    echo "\033[1;34m" . str_repeat("=", 80) . "\033[0m\n";
    echo "\033[1;34mSQL Export\033[0m\n";
    echo "\033[1;34m" . str_repeat("=", 80) . "\033[0m\n\n";
    
    foreach ($tables as $table) {
        echo "-- Table: {$table}\n";
        
        if ($options['command_type'] === '3' || $options['content_type'] === '1' || $options['content_type'] === '3') {
            $createSql = getTableStructure($conn, $table);
            echo $createSql . "\n\n";
        }
        
        if ($options['command_type'] !== '3' && ($options['content_type'] === '2' || $options['content_type'] === '3')) {
            echo "-- Records:\n";
            
            $sql = "SELECT * FROM `{$table}`";
            $stmt = $conn->query($sql);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($rows)) {
                echo "-- No records found\n\n";
                continue;
            }
            
            if ($options['command_type'] === '2') {
                foreach ($rows as $row) {
                    $columns = array_keys($row);
                    $values = array_map(function($val) {
                        if ($val === null) return 'NULL';
                        if (is_numeric($val)) return $val;
                        return "'" . addslashes($val) . "'";
                    }, array_values($row));
                    
                    echo "SELECT * FROM `{$table}` WHERE ";
                    $conditions = [];
                    foreach ($columns as $i => $col) {
                        $conditions[] = "`{$col}` = " . $values[$i];
                    }
                    echo implode(" AND ", $conditions) . ";\n";
                }
            } else {
                foreach ($rows as $row) {
                    $columns = array_keys($row);
                    $values = array_map(function($val) {
                        if ($val === null) return 'NULL';
                        if (is_numeric($val)) return $val;
                        return "'" . addslashes($val) . "'";
                    }, array_values($row));
                    
                    echo "INSERT INTO `{$table}` (`" . implode('`, `', $columns) . "`) VALUES (" . implode(', ', $values) . ");\n";
                }
            }
            
            echo "\n";
        }
    }
    
    echo "\033[1;34m" . str_repeat("=", 80) . "\033[0m\n";
    showSuccess("SQL export completed for " . count($tables) . " table(s).");
}

function exportAsSQLFile($conn, $tables, $backendDir, $options) {
    $filename = $backendDir . '/export_' . date('Y-m-d_H-i-s') . '.sql';
    
    $content = "-- Database Export\n";
    $content .= "-- Generated: " . date('Y-m-d H:i:s') . "\n";
    $content .= "-- Tables: " . implode(', ', $tables) . "\n\n";
    
    foreach ($tables as $table) {
        $content .= "-- Table: {$table}\n";
        
        if ($options['command_type'] === '3' || $options['content_type'] === '1' || $options['content_type'] === '3') {
            $createSql = getTableStructure($conn, $table);
            $content .= $createSql . "\n\n";
        }
        
        if ($options['command_type'] !== '3' && ($options['content_type'] === '2' || $options['content_type'] === '3')) {
            $content .= "-- Records:\n";
            
            $sql = "SELECT * FROM `{$table}`";
            $stmt = $conn->query($sql);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($rows)) {
                $content .= "-- No records found\n\n";
                continue;
            }
            
            if ($options['command_type'] === '2') {
                foreach ($rows as $row) {
                    $columns = array_keys($row);
                    $values = array_map(function($val) {
                        if ($val === null) return 'NULL';
                        if (is_numeric($val)) return $val;
                        return "'" . addslashes($val) . "'";
                    }, array_values($row));
                    
                    $content .= "SELECT * FROM `{$table}` WHERE ";
                    $conditions = [];
                    foreach ($columns as $i => $col) {
                        $conditions[] = "`{$col}` = " . $values[$i];
                    }
                    $content .= implode(" AND ", $conditions) . ";\n";
                }
            } else {
                foreach ($rows as $row) {
                    $columns = array_keys($row);
                    $values = array_map(function($val) {
                        if ($val === null) return 'NULL';
                        if (is_numeric($val)) return $val;
                        return "'" . addslashes($val) . "'";
                    }, array_values($row));
                    
                    $content .= "INSERT INTO `{$table}` (`" . implode('`, `', $columns) . "`) VALUES (" . implode(', ', $values) . ");\n";
                }
            }
            
            $content .= "\n";
        }
    }
    
    file_put_contents($filename, $content);
    showSuccess("SQL file exported to: {$filename}");
}

function exportAsJSONFile($conn, $tables, $backendDir, $options) {
    $filename = $backendDir . '/export_' . date('Y-m-d_H-i-s') . '.json';
    
    $data = [
        'exported_at' => date('Y-m-d H:i:s'),
        'command_type' => ['1' => 'INSERT', '2' => 'SELECT', '3' => 'CREATE TABLE'][$options['command_type']],
        'content_type' => ['1' => 'structure', '2' => 'data', '3' => 'both'][$options['content_type']],
        'tables' => []
    ];
    
    foreach ($tables as $table) {
        $tableData = [
            'name' => $table
        ];
        
        if ($options['command_type'] === '3' || $options['content_type'] === '1' || $options['content_type'] === '3') {
            $tableData['structure'] = getTableStructure($conn, $table);
        }
        
        if ($options['command_type'] !== '3' && ($options['content_type'] === '2' || $options['content_type'] === '3')) {
            $sql = "SELECT * FROM `{$table}`";
            $stmt = $conn->query($sql);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $tableData['record_count'] = count($rows);
            
            if ($options['command_type'] === '2') {
                $tableData['queries'] = [];
                foreach ($rows as $row) {
                    $columns = array_keys($row);
                    $values = array_map(function($val) {
                        if ($val === null) return 'NULL';
                        if (is_numeric($val)) return $val;
                        return "'" . addslashes($val) . "'";
                    }, array_values($row));
                    
                    $query = "SELECT * FROM `{$table}` WHERE ";
                    $conditions = [];
                    foreach ($columns as $i => $col) {
                        $conditions[] = "`{$col}` = " . $values[$i];
                    }
                    $query .= implode(" AND ", $conditions) . ";";
                    $tableData['queries'][] = $query;
                }
            } else {
                $tableData['inserts'] = [];
                foreach ($rows as $row) {
                    $columns = array_keys($row);
                    $values = array_map(function($val) {
                        if ($val === null) return 'NULL';
                        if (is_numeric($val)) return $val;
                        return "'" . addslashes($val) . "'";
                    }, array_values($row));
                    
                    $insert = "INSERT INTO `{$table}` (`" . implode('`, `', $columns) . "`) VALUES (" . implode(', ', $values) . ");";
                    $tableData['inserts'][] = $insert;
                }
            }
            
            $tableData['records'] = $rows;
        }
        
        $data['tables'][] = $tableData;
    }
    
    $json = json_encode($data, JSON_PRETTY_PRINT);
    file_put_contents($filename, $json);
    showSuccess("JSON file exported to: {$filename}");
}

function getTableStructure($conn, $table) {
    $sql = "SHOW CREATE TABLE `{$table}`";
    $stmt = $conn->query($sql);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    return $result['Create Table'];
}
