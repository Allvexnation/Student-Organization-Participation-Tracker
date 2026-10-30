<?php

function manageCache($backendDir) {
    echo "\n--- Cache Management ---\n";
    echo "SQLite cache database location: {$backendDir}/cache/data/cache.db\n";
    echo "\n";
    echo "Available options:\n";
    echo "  1. Flush all cache\n";
    echo "  2. Remove expired cache entries\n";
    echo "  3. View cache statistics\n";
    echo "  4. Delete cache database file\n";
    echo "  0. Back\n";
    echo "\n";
    echo "Choice: ";
    
    $choice = trim(fgets(STDIN));
    
    require_once $backendDir . '/cache/CacheService.php';
    
    switch ($choice) {
        case '1':
            echo "\nFlushing all cache entries...\n";
            CacheService::flush();
            echo "Cache flushed successfully.\n";
            break;
            
        case '2':
            echo "\nRemoving expired cache entries...\n";
            removeExpiredCache($backendDir);
            echo "Expired cache entries removed.\n";
            break;
            
        case '3':
            echo "\nCache Statistics:\n";
            echo "----------------------------------------\n";
            $stats = CacheService::getStats();
            echo "Total entries: " . $stats['entry_count'] . "\n";
            echo "Total size: " . formatBytes($stats['total_size_bytes']) . "\n";
            echo "Memory cached: " . $stats['memory_cached_count'] . "\n";
            echo "----------------------------------------\n";
            break;
            
        case '4':
            echo "\nAre you sure you want to delete the cache database file? (y/n): ";
            $confirm = trim(fgets(STDIN));
            if (strtolower($confirm) === 'y') {
                $dbPath = $backendDir . '/cache/data/cache.db';
                if (file_exists($dbPath)) {
                    unlink($dbPath);
                    echo "Cache database file deleted.\n";
                } else {
                    echo "Cache database file does not exist.\n";
                }
            } else {
                echo "Operation cancelled.\n";
            }
            break;
            
        case '0':
            return;
            
        default:
            echo "Invalid choice.\n";
    }
}

function removeExpiredCache($backendDir) {
    $dbPath = $backendDir . '/cache/data/cache.db';
    
    if (!file_exists($dbPath)) {
        echo "Cache database does not exist.\n";
        return;
    }
    
    try {
        $db = new PDO('sqlite:' . $dbPath);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        $stmt = $db->prepare("DELETE FROM cache WHERE expires_at != 0 AND expires_at < ?");
        $stmt->execute([time()]);
        $count = $stmt->rowCount();
        
        echo "Removed {$count} expired entries.\n";
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
}

function formatBytes($bytes, $precision = 2) {
    $units = ['B', 'KB', 'MB', 'GB'];
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    $bytes /= (1 << (10 * $pow));
    return round($bytes, $precision) . ' ' . $units[$pow];
}
