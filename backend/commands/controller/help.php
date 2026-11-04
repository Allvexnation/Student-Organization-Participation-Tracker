<?php

function showHelp() {
    showHeader('help');
    echo "Interactive Menu Options:\n\n";
    echo "  1. Start development server    Start PHP development server\n";
    echo "  2. Make controller             Create a new controller\n";
    echo "  3. Make model                  Create a new model\n";
    echo "  4. Make migration              Create a new migration file\n";
    echo "  5. Make route                  Create a new route\n";
    echo "  6. Make bundle                 Create controller + model + route bundle\n";
    echo "  7. Run seeder                  Seed database with initial data\n";
    echo "  8. Migration status            Show migration status\n";
    echo "  9. Run migrations              Run database migrations\n";
    echo "  10. Rollback migrations        Rollback last N migrations\n";
    echo "  11. Reset migrations           Reset all migrations\n";
    echo "  12. Database summary           Show database summary\n";
    echo "  0. Exit                        Exit the CLI menu\n\n";
}