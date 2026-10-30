<?php

function showSuccess($message) {
    echo "\033[0;32m✓ {$message}\033[0m\n";
}

function showError($message) {
    echo "\033[0;31m✗ {$message}\033[0m\n";
}

function showInfo($message) {
    echo "\033[0;34mℹ {$message}\033[0m\n";
}

function showWarning($message) {
    echo "\033[0;33m⚠ {$message}\033[0m\n";
}

function showLoadingBar($message, $steps = 5) {
    echo "\033[0;34m{$message}\033[0m\n";
    $barWidth = 40;
    
    for ($i = 0; $i <= $steps; $i++) {
        $progress = ($i / $steps);
        $filled = round($barWidth * $progress);
        $empty = $barWidth - $filled;
        
        $bar = "\r\033[0;34m[";
        $bar .= str_repeat("█", $filled);
        $bar .= str_repeat("░", $empty);
        $bar .= "] " . round($progress * 100) . "%";
        echo $bar;
        
        if ($i < $steps) {
            usleep(200000);
        }
    }
    echo "\n";
}

function showSpinner($message, $callback) {
    echo "\033[0;34m{$message} ";
    $spinners = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    $i = 0;

    $start = microtime(true);
    $result = $callback();
    $duration = microtime(true) - $start;

    $frames = min(count($spinners), (int)($duration * 10));
    for ($j = 0; $j < $frames; $j++) {
        echo "\r\033[0;34m" . $spinners[$j % count($spinners)] . "\033[0m";
        usleep(50000);
    }
    
    echo "\r\033[0;32m✓\033[0m\n";
    return $result;
}
