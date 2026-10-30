<?php

function runSeeder($backendDir) {
    echo "\n--- Run Seeder ---\n";
    
    $seedersDir = $backendDir . '/seeders';
    
    if (!is_dir($seedersDir)) {
        echo "Error: Seeders directory not found: {$seedersDir}\n";
        return;
    }

    $seederFiles = glob($seedersDir . '/*.php');
    
    if (empty($seederFiles)) {
        echo "No seeder files found in {$seedersDir}\n";
        return;
    }
    
    echo "Available seeders:\n";
    foreach ($seederFiles as $index => $file) {
        $fileName = basename($file);
        echo "  " . ($index + 1) . ". {$fileName}\n";
    }
    echo "\n";
    
    echo "Select seeder to run (1-" . count($seederFiles) . "): ";
    $choice = trim(fgets(STDIN));
    
    $choiceIndex = (int)$choice - 1;
    
    if (!isset($seederFiles[$choiceIndex])) {
        echo "Invalid choice.\n";
        return;
    }
    
    $selectedFile = $seederFiles[$choiceIndex];
    $fileName = basename($selectedFile);
    
    echo "\nRunning seeder: {$fileName}\n";
    echo "----------------------------------------\n";

    require_once $selectedFile;

    $className = str_replace('.php', '', $fileName);
    
    if (class_exists($className)) {
        $seeder = new $className();
        if (method_exists($seeder, 'run')) {
            $seeder->run();
        } else {
            echo "Error: Seeder class '{$className}' does not have a run() method.\n";
        }
    } else {
        echo "Error: Could not find seeder class '{$className}' in {$fileName}\n";
    }
    
    echo "----------------------------------------\n";
    echo "Seeder execution complete.\n";
}
