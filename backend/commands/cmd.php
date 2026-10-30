<?php

if (php_sapi_name() !== 'cli') {
    echo "This script can only be run from the command line.\n";
    exit(1);
}

$command = isset($argv[1]) ? $argv[1] : null;
$backendDir = dirname(__DIR__);

require_once __DIR__ . '/components/header.php';
require_once __DIR__ . '/components/loading.php';
require_once __DIR__ . '/controller/help.php';

if (!$command) {
    showInteractiveMenu($backendDir);
    exit(0);
}

switch ($command) {
    case 'migrate':
        showLoadingBar("Running migrations", 5);
        require_once $backendDir . '/migrations/Migrator.php';
        $migrationsPath = $backendDir . '/migrations';
        $migrator = new Migrator($migrationsPath);
        $migrator->migrate();
        break;

    case 'rollback':
        showLoadingBar("Rolling back migrations", 3);
        require_once $backendDir . '/migrations/Migrator.php';
        $migrationsPath = $backendDir . '/migrations';
        $migrator = new Migrator($migrationsPath);
        $steps = isset($argv[2]) ? (int)$argv[2] : 1;
        $migrator->rollback($steps);
        break;

    case 'reset':
        showLoadingBar("Resetting migrations", 5);
        require_once $backendDir . '/migrations/Migrator.php';
        $migrationsPath = $backendDir . '/migrations';
        $migrator = new Migrator($migrationsPath);
        $migrator->reset();
        break;

    case 'status':
        require_once $backendDir . '/migrations/Migrator.php';
        $migrationsPath = $backendDir . '/migrations';
        $migrator = new Migrator($migrationsPath);
        $migrator->status();
        break;

    case 'seed':
        showLoadingBar("Running seeder", 3);
        require_once $backendDir . '/seeders/AdminSeeder.php';
        $seeder = new AdminSeeder();
        $seeder->run();
        break;

    case 'serve':
        $host = isset($argv[2]) ? $argv[2] : 'localhost';
        $port = isset($argv[3]) ? $argv[3] : '8000';
        showLoadingBar("Starting PHP development server", 3);
        showInfo("Server running on http://{$host}:{$port}");
        showWarning("Press Ctrl+C to stop the server");
        passthru("php -S {$host}:{$port}");
        break;

    case 'switch':
        require_once __DIR__ . '/controller/switch.php';
        switchEnvironment($backendDir);
        break;

    case 'credits':
        require_once __DIR__ . '/controller/credits.php';
        showCredits();
        break;

    case 'help':
    default:
        showHelp();
        break;
}

function showInteractiveMenu($backendDir) {
    while (true) {
        // Clear the screen
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            system('cls');
        } else {
            system('clear');
        }
        showHeader('menu');
        echo "\033[1;34mSelect an option:\033[0m\n";
        echo "  \033[0;33m1.\033[0m Start development server\n";
        echo "  \033[0;33m2.\033[0m Make controller\n";
        echo "  \033[0;33m3.\033[0m Make model\n";
        echo "  \033[0;33m4.\033[0m Make migration\n";
        echo "  \033[0;33m5.\033[0m Make route\n";
        echo "  \033[0;33m6.\033[0m Make bundle (controller + model + route)\n";
        echo "  \033[0;33m7.\033[0m Run seeder\n";
        echo "  \033[0;33m8.\033[0m Migration status\n";
        echo "  \033[0;33m9.\033[0m Run migrations\n";
        echo "  \033[0;33m10.\033[0m Rollback migrations\n";
        echo "  \033[0;33m11.\033[0m Reset migrations\n";
        echo "  \033[0;33m12.\033[0m Database summary\n";
        echo "  \033[0;33m13.\033[0m Switch environment settings\n";
        echo "  \033[0;33m14.\033[0m Credits\n";
        echo "  \033[0;33m15.\033[0m View README documentation\n";
        echo "  \033[0;31m0.\033[0m Exit\n";
        echo "\n";
        echo "\033[1;34mChoice:\033[0m ";

        $choice = trim(fgets(STDIN));

        switch ($choice) {
            case '1':
                showLoadingBar("Starting PHP development server", 3);
                showWarning("Press Ctrl+C to stop the server");
                passthru("npx php-run-devs");
                break;

            case '2':
                showLoadingBar("Creating controller", 3);
                require_once __DIR__ . '/controller/controller.php';
                makeController($backendDir);
                break;

            case '3':
                showLoadingBar("Creating model", 3);
                require_once __DIR__ . '/controller/model.php';
                makeModel($backendDir);
                break;

            case '4':
                showLoadingBar("Creating migration", 3);
                require_once __DIR__ . '/controller/migration.php';
                makeMigration($backendDir);
                break;

            case '5':
                showLoadingBar("Creating route", 3);
                require_once __DIR__ . '/controller/routes.php';
                makeRoute($backendDir);
                break;

            case '6':
                showLoadingBar("Creating bundle", 5);
                require_once __DIR__ . '/controller/bundle.php';
                makeBundle($backendDir);
                break;

            case '7':
                showLoadingBar("Running seeder", 3);
                require_once __DIR__ . '/controller/seed.php';
                runSeeder($backendDir);
                break;

            case '8':
                showLoadingBar("Checking migration status", 3);
                require_once $backendDir . '/migrations/Migrator.php';
                $migrator = new Migrator($backendDir . '/migrations');
                $migrator->status();
                break;

            case '9':
                showLoadingBar("Running migrations", 5);
                require_once $backendDir . '/migrations/Migrator.php';
                $migrator = new Migrator($backendDir . '/migrations');
                $migrator->migrate();
                break;

            case '10':
                echo "Number of steps to rollback (default 1): ";
                $steps = trim(fgets(STDIN));
                $steps = $steps ? (int)$steps : 1;
                showLoadingBar("Rolling back migrations", 3);
                require_once $backendDir . '/migrations/Migrator.php';
                $migrator = new Migrator($backendDir . '/migrations');
                $migrator->rollback($steps);
                break;

            case '11':
                showLoadingBar("Resetting migrations", 5);
                require_once $backendDir . '/migrations/Migrator.php';
                $migrator = new Migrator($backendDir . '/migrations');
                $migrator->reset();
                break;

            case '12':
                showLoadingBar("Generating database summary", 3);
                require_once __DIR__ . '/controller/database.php';
                showDatabaseSummary($backendDir);
                break;

            case '13':
                require_once __DIR__ . '/controller/switch.php';
                switchEnvironment($backendDir);
                break;

            case '14':
                require_once __DIR__ . '/controller/credits.php';
                showCredits();
                break;

            case '15':
                require_once __DIR__ . '/controller/readme.php';
                showReadme($backendDir);
                break;

            case '0':
                showSuccess("Goodbye!");
                return;

            default:
                showError("Invalid choice. Please try again.");
                sleep(2);
                continue 2;
        }

        echo "\n\033[1;34mPress Enter to continue or 'q' to quit:\033[0m ";
        $continue = trim(fgets(STDIN));
        if (strtolower($continue) === 'q') {
            showSuccess("Goodbye!");
            return;
        }
    }
}
