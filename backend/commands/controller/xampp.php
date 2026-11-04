<?php

function startXampp() {
    showHeader('XAMPP Control');
    
    $xamppPaths = [
        'C:\\xampp',
        'D:\\xampp',
        'C:\\Program Files\\xampp',
        'C:\\Program Files (x86)\\xampp'
    ];
    
    $xamppPath = null;
    foreach ($xamppPaths as $path) {
        if (file_exists($path)) {
            $xamppPath = $path;
            break;
        }
    }
    
    if (!$xamppPath) {
        showError("XAMPP installation not found. Please ensure XAMPP is installed.");
        echo "\n\033[1;33mCommon installation paths checked:\033[0m\n";
        foreach ($xamppPaths as $path) {
            echo "  - {$path}\n";
        }
        return;
    }
    
    echo "\033[1;34mXAMPP found at:\033[0m {$xamppPath}\n";
    echo "\033[1;34mStarting Apache and MySQL...\033[0m\n\n";

    $apacheRunning = false;
    $mysqlRunning = false;
    
    exec('tasklist /FI "IMAGENAME eq httpd.exe" 2>NUL', $apacheOutput);
    if (count($apacheOutput) > 1) {
        $apacheRunning = true;
        showInfo("Apache is already running");
    }

    exec('tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL', $mysqlOutput);
    if (count($mysqlOutput) > 1) {
        $mysqlRunning = true;
        showInfo("MySQL is already running");
    }

    if (!$apacheRunning) {
        showLoadingBar("Starting Apache", 3);
        $apacheBin = $xamppPath . '\\apache\\bin\\httpd.exe';
        if (file_exists($apacheBin)) {
            $psCommand = "Start-Process -FilePath '{$apacheBin}' -WindowStyle Hidden";
            exec("powershell -Command \"{$psCommand}\"");
            sleep(3);
            showSuccess("Apache started");
        } else {
            showError("Could not find Apache at: {$apacheBin}");
        }
    }

    if (!$mysqlRunning) {
        showLoadingBar("Starting MySQL", 3);
        $mysqlBin = $xamppPath . '\\mysql\\bin\\mysqld.exe';
        if (file_exists($mysqlBin)) {
            $psCommand = "Start-Process -FilePath '{$mysqlBin}' -WindowStyle Hidden";
            exec("powershell -Command \"{$psCommand}\"");
            sleep(3);
            showSuccess("MySQL started");

            showLoadingBar("Opening phpMyAdmin", 2);
            $phpMyAdminUrl = "http://localhost/phpmyadmin";
            $psUrlCommand = "Start-Process '{$phpMyAdminUrl}'";
            exec("powershell -Command \"{$psUrlCommand}\"");
            showSuccess("phpMyAdmin opened in browser");
        } else {
            showError("Could not find MySQL at: {$mysqlBin}");
        }
    }
    
    echo "\n\033[1;32mXAMPP services started successfully!\033[0m\n";

    echo "\033[1;34mDo you want to open XAMPP Control Panel? (y/n):\033[0m ";
    $openControl = trim(fgets(STDIN));
    
    if (strtolower($openControl) === 'y' || strtolower($openControl) === 'yes') {
        $xamppControl = $xamppPath . '\\xampp-control.exe';
        if (file_exists($xamppControl)) {
            showLoadingBar("Opening XAMPP Control Panel", 2);
            exec("powershell -Command \"Start-Process '{$xamppControl}'\"");
            showSuccess("XAMPP Control Panel opened");
        } else {
            showError("Could not find XAMPP Control Panel at: {$xamppControl}");
        }
    }
}

function stopXampp() {
    showHeader('XAMPP Control');
    echo "\033[1;34mStopping Apache and MySQL...\033[0m\n\n";
    
    $apacheStopped = false;
    $mysqlStopped = false;

    exec('tasklist /FI "IMAGENAME eq httpd.exe" 2>NUL', $apacheOutput);
    if (count($apacheOutput) > 1) {
        showLoadingBar("Stopping Apache", 3);
        exec('taskkill /F /IM httpd.exe 2>NUL', $killOutput);
        sleep(2);
        showSuccess("Apache stopped");
        $apacheStopped = true;
    } else {
        showInfo("Apache is not running");
    }

    exec('tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL', $mysqlOutput);
    if (count($mysqlOutput) > 1) {
        showLoadingBar("Stopping MySQL", 3);
        exec('taskkill /F /IM mysqld.exe 2>NUL', $killOutput);
        sleep(2);
        showSuccess("MySQL stopped");
        $mysqlStopped = true;
    } else {
        showInfo("MySQL is not running");
    }

    exec('tasklist /FI "IMAGENAME eq xampp-control.exe" 2>NUL', $controlOutput);
    if (count($controlOutput) > 1) {
        showLoadingBar("Closing XAMPP Control Panel", 2);
        exec('taskkill /F /IM xampp-control.exe 2>NUL', $killOutput);
        showSuccess("XAMPP Control Panel closed");
    }
    
    if ($apacheStopped || $mysqlStopped) {
        echo "\n\033[1;32mXAMPP services stopped successfully!\033[0m\n";
    } else {
        echo "\n\033[1;33mNo XAMPP services were running.\033[0m\n";
    }
}
