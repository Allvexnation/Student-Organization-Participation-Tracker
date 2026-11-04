<?php

class CacheService {
    private static $cacheDir = __DIR__ . '/data';
    private static $dbPath;
    private static $defaultTtl = 300;
    private static $memoryCache = [];
    private static $db = null;

    public static function init() {
        if (!is_dir(self::$cacheDir)) {
            @mkdir(self::$cacheDir, 0755, true);
        }
        self::$dbPath = self::$cacheDir . '/cache.db';
    }

    private static function getDb() {
        if (self::$db === null) {
            self::init();
            self::$db = new PDO('sqlite:' . self::$dbPath);
            self::$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            self::createTable();
        }
        return self::$db;
    }

    private static function createTable() {
        $db = self::getDb();
        $db->exec("CREATE TABLE IF NOT EXISTS cache (
            key TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL
        )");
        $db->exec("CREATE INDEX IF NOT EXISTS idx_expires_at ON cache(expires_at)");
    }

    public static function get($key, $default = null) {
        if (array_key_exists($key, self::$memoryCache)) {
            $item = self::$memoryCache[$key];
            if ($item['expires_at'] === 0 || $item['expires_at'] >= time()) {
                return $item['data'];
            }
            unset(self::$memoryCache[$key]);
        }

        try {
            $db = self::getDb();
            $stmt = $db->prepare("SELECT data, expires_at FROM cache WHERE key = ?");
            $stmt->execute([$key]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$row) {
                return $default;
            }

            if ($row['expires_at'] !== 0 && $row['expires_at'] < time()) {
                self::forget($key);
                return $default;
            }

            $data = json_decode($row['data'], true);
            self::$memoryCache[$key] = [
                'expires_at' => $row['expires_at'],
                'data' => $data
            ];

            return $data;
        } catch (Exception $e) {
            return $default;
        }
    }

    public static function set($key, $value, $ttlSeconds = null) {
        $ttl = ($ttlSeconds === null) ? self::$defaultTtl : (int)$ttlSeconds;
        $expiresAt = ($ttl === 0) ? 0 : (time() + $ttl);

        $payload = [
            'key' => $key,
            'created_at' => time(),
            'expires_at' => $expiresAt,
            'data' => $value
        ];

        self::$memoryCache[$key] = [
            'expires_at' => $expiresAt,
            'data' => $value
        ];

        try {
            $db = self::getDb();
            $json = json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            if ($json === false) {
                return false;
            }

            $stmt = $db->prepare("INSERT OR REPLACE INTO cache (key, data, created_at, expires_at) VALUES (?, ?, ?, ?)");
            return $stmt->execute([$key, $json, time(), $expiresAt]);
        } catch (Exception $e) {
            return false;
        }
    }

    public static function remember($key, $ttlSeconds, callable $callback) {
        $value = self::get($key);
        if ($value !== null) {
            return $value;
        }

        $fresh = $callback();
        if ($fresh !== null && $fresh !== false) {
            self::set($key, $fresh, $ttlSeconds);
        }

        return $fresh;
    }

    public static function has($key) {
        return self::get($key) !== null;
    }

    public static function forget($key) {
        if (array_key_exists($key, self::$memoryCache)) {
            unset(self::$memoryCache[$key]);
        }

        try {
            $db = self::getDb();
            $stmt = $db->prepare("DELETE FROM cache WHERE key = ?");
            return $stmt->execute([$key]);
        } catch (Exception $e) {
            return false;
        }
    }

    public static function forgetByPrefix($prefix) {
        $count = 0;

        foreach (array_keys(self::$memoryCache) as $k) {
            if (strpos($k, $prefix) === 0) {
                unset(self::$memoryCache[$k]);
            }
        }

        try {
            $db = self::getDb();
            $stmt = $db->prepare("DELETE FROM cache WHERE key LIKE ?");
            $stmt->execute([$prefix . '%']);
            $count = $stmt->rowCount();
        } catch (Exception $e) {
        }

        return $count;
    }

    public static function flush() {
        self::$memoryCache = [];

        try {
            $db = self::getDb();
            $db->exec("DELETE FROM cache");
            return true;
        } catch (Exception $e) {
            return false;
        }
    }

    public static function getStats() {
        $count = 0;
        $totalSize = 0;

        try {
            $db = self::getDb();
            $stmt = $db->query("SELECT COUNT(*) as count, SUM(LENGTH(data)) as size FROM cache");
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                $count = (int)$row['count'];
                $totalSize = (int)$row['size'];
            }
        } catch (Exception $e) {
        }

        return [
            'entry_count' => $count,
            'total_size_bytes' => $totalSize,
            'memory_cached_count' => count(self::$memoryCache)
        ];
    }
}

