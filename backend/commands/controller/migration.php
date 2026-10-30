<?php

function makeMigration($backendDir) {
    echo "\n--- Make Migration ---\n";
    echo "Migration name (e.g., create_users_table, add_email_to_users): ";
    $name = trim(fgets(STDIN));

    if (empty($name)) {
        echo "Error: Migration name cannot be empty.\n";
        return;
    }

    $timestamp = date('Y_m_d_His');
    $fileName = $timestamp . '_' . $name . '.php';
    $filePath = $backendDir . '/migrations/' . $fileName;

    if (file_exists($filePath)) {
        echo "Error: Migration '{$fileName}' already exists.\n";
        return;
    }

    $className = str_replace(' ', '', ucwords(str_replace('_', ' ', $name)));

    $content = "<?php\n\n";
    $content .= "require_once __DIR__ . '/Migration.php';\n\n";
    $content .= "class {$className} extends Migration {\n";
    $content .= "    public function up() {\n";
    $content .= "        \$this->db->exec(\"\n";
    $content .= "            CREATE TABLE IF NOT EXISTS your_table_name (\n";
    $content .= "                id INT AUTO_INCREMENT PRIMARY KEY,\n";
    $content .= "                name VARCHAR(255) NOT NULL,\n";
    $content .= "                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n";
    $content .= "                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP\n";
    $content .= "            )\n";
    $content .= "        \");\n";
    $content .= "    }\n\n";
    $content .= "    public function down() {\n";
    $content .= "        \$this->db->exec(\"DROP TABLE IF EXISTS your_table_name\");\n";
    $content .= "    }\n";
    $content .= "}\n";

    if (file_put_contents($filePath, $content)) {
        echo "✓ Migration '{$fileName}' created successfully at: {$filePath}\n";
        echo "  Remember to edit the table name and columns in the up() method.\n";

        echo "\nRun migrations now? (y/n): ";
        $runMigrations = strtolower(trim(fgets(STDIN))) === 'y';
        
        if ($runMigrations) {
            echo "\nRunning migrations...\n";
            require_once $backendDir . '/migrations/Migrator.php';
            $migrator = new Migrator($backendDir . '/migrations');
            $migrator->migrate();
        }
    } else {
        echo "✗ Failed to create migration '{$fileName}'.\n";
    }
}
