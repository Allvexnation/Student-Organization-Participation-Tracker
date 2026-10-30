<?php

function showReadme($backendDir) {
    $readmePath = $backendDir . '/README.md';
    
    if (!file_exists($readmePath)) {
        showError("README.md file not found at: " . $readmePath);
        return;
    }
    
    $content = file_get_contents($readmePath);
    
    echo "\n";
    echo "\033[1;36m" . str_repeat("=", 60) . "\033[0m\n";
    echo "\033[1;36m" . str_pad("BACKEND DOCUMENTATION", 60) . "\033[0m\n";
    echo "\033[1;36m" . str_repeat("=", 60) . "\033[0m\n";
    echo "\n";
    
    $lines = explode("\n", $content);
    foreach ($lines as $line) {
        if (preg_match('/^#{1,6}\s+(.+)$/', $line, $matches)) {
            $level = strlen($matches[0]) - strlen(ltrim($matches[0], '#'));
            $text = trim($matches[1]);
            if ($level == 1) {
                echo "\033[1;33m" . strtoupper($text) . "\033[0m\n";
                echo "\033[1;36m" . str_repeat("-", strlen($text)) . "\033[0m\n";
            } elseif ($level == 2) {
                echo "\n\033[1;34m" . $text . "\033[0m\n";
            } else {
                echo "\n\033[1;36m" . $text . "\033[0m\n";
            }
        }
        elseif (preg_match('/\*\*(.+?)\*\*/', $line, $matches)) {
            $line = preg_replace('/\*\*(.+?)\*\*/', "\033[1m$1\033[0m", $line);
            echo $line . "\n";
        }
        elseif (preg_match('/^```(.+)$/', $line, $matches)) {
            echo "\033[0;90m" . $line . "\033[0m\n";
        }
        elseif (preg_match('/`([^`]+)`/', $line, $matches)) {
            $line = preg_replace('/`([^`]+)`/', "\033[0;36m$1\033[0m", $line);
            echo $line . "\n";
        }
        else {
            echo $line . "\n";
        }
    }
    
    echo "\n";
    echo "\033[1;36m" . str_repeat("=", 60) . "\033[0m\n";
    echo "\n";
}
