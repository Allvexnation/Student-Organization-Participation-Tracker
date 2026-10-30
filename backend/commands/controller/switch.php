<?php

function switchEnvironment($backendDir) {
    $envFile = $backendDir . '/.env';
    
    if (!file_exists($envFile)) {
        showError(".env file not found. Please create it from .env.example");
        return;
    }

    $envContent = file_get_contents($envFile);
    $lines = explode("\n", $envContent);
    $currentSettings = [];

    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            $parts = explode('=', $line, 2);
            $key = trim($parts[0]);
            $value = trim($parts[1]);
            $currentSettings[$key] = $value;
        }
    }

    showHeader('environment switch');
    echo "\033[1;34mCurrent Environment Settings:\033[0m\n";
    echo "  \033[0;33m1.\033[0m DB_CONNECTION: " . ($currentSettings['DB_CONNECTION'] ?? 'Not set') . "\n";
    echo "  \033[0;33m2.\033[0m CORS_CONNECTION: " . ($currentSettings['CORS_CONNECTION'] ?? 'Not set') . "\n";
    echo "  \033[0;33m3.\033[0m JWT_CONNECTION: " . ($currentSettings['JWT_CONNECTION'] ?? 'Not set') . "\n";
    echo "  \033[0;33m4.\033[0m MAILER_CONNECTION: " . ($currentSettings['MAILER_CONNECTION'] ?? 'Not set') . "\n";
    echo "\n";
    echo "\033[1;34mSelect a setting to switch (1-4), or 'a' to switch all, or '0' to cancel:\033[0m ";
    
    $choice = trim(fgets(STDIN));
    
    if ($choice === '0') {
        showInfo("Operation cancelled.");
        return;
    }

    echo "\033[1;34mSwitch to (P)roduction or (D)evelopment?\033[0m ";
    $envChoice = strtoupper(trim(fgets(STDIN)));
    
    $targetEnv = ($envChoice === 'P') ? 'Production' : 'Development';
    
    $settingsToSwitch = [];
    
    if ($choice === 'a' || $choice === 'A') {
        $settingsToSwitch = ['DB_CONNECTION', 'CORS_CONNECTION', 'JWT_CONNECTION', 'MAILER_CONNECTION'];
    } elseif (in_array($choice, ['1', '2', '3', '4'])) {
        $mapping = ['1' => 'DB_CONNECTION', '2' => 'CORS_CONNECTION', '3' => 'JWT_CONNECTION', '4' => 'MAILER_CONNECTION'];
        $settingsToSwitch = [$mapping[$choice]];
    } else {
        showError("Invalid choice.");
        return;
    }

    $updated = false;
    foreach ($lines as &$line) {
        foreach ($settingsToSwitch as $setting) {
            if (strpos($line, $setting . '=') === 0) {
                $line = $setting . '=' . $targetEnv;
                $updated = true;
            }
        }
    }

    if ($updated) {
        file_put_contents($envFile, implode("\n", $lines));
        showSuccess("Environment settings updated successfully!");
        echo "\n\033[1;32mUpdated settings:\033[0m\n";
        foreach ($settingsToSwitch as $setting) {
            echo "  \033[0;32m✓\033[0m {$setting} = {$targetEnv}\n";
        }
    } else {
        showError("No settings were updated. Make sure the settings exist in .env file.");
    }
}
