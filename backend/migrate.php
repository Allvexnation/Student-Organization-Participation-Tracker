<?php

require_once __DIR__ . '/migrations/Migrator.php';

if (php_sapi_name() !== 'cli') {
    echo "This script can only be run from the command line.\n";
    exit(1);
}

$command = isset($argv[1]) ? $argv[1] : 'migrate';
$migrationsPath = __DIR__ . '/migrations';

$migrator = new Migrator($migrationsPath);

switch ($command) {
    case 'migrate':
        $migrator->migrate();
        break;
    
    case 'rollback':
        $steps = isset($argv[2]) ? (int)$argv[2] : 1;
        $migrator->rollback($steps);
        break;
    
    case 'reset':
        $migrator->reset();
        break;
    
    case 'status':
        $migrator->status();
        break;
    
    default:
        echo "Unknown command: {$command}\n\n";
        echo "Available commands:\n";
        echo "  php migrate.php migrate\n";
        echo "  php migrate.php rollback\n";
        echo "  php migrate.php rollback N\n";
        echo "  php migrate.php reset\n";
        echo "  php migrate.php status\n";
        break;
}
