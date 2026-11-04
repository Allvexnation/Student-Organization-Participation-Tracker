<?php

require_once __DIR__ . '/env.php';

loadEnv(__DIR__ . '/../.env');

class Database {
    private static $instance = null;
    private $host;
    private $username;
    private $password;
    private $database;
    private $port;
    public $conn;

    private function __construct() {
        $connection = getenv('DB_CONNECTION');

        if ($connection === 'Production') {
            $this->host = getenv('PROD_DB_HOST');
            $this->username = getenv('PROD_DB_USERNAME');
            $this->password = getenv('PROD_DB_PASSWORD');
            $this->database = getenv('PROD_DB_DATABASE');
            $this->port = getenv('PROD_DB_PORT');
        } else {
            $this->host = getenv('DEV_DB_HOST');
            $this->username = getenv('DEV_DB_USERNAME');
            $this->password = getenv('DEV_DB_PASSWORD');
            $this->database = getenv('DEV_DB_DATABASE');
            $this->port = getenv('DEV_DB_PORT');
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection($withoutDatabase = false) {
        if ($this->conn !== null) {
            return $this->conn;
        }

        try {
            $dsn = "mysql:host=" . $this->host . ";port=" . $this->port;
            if (!$withoutDatabase) {
                $dsn .= ";dbname=" . $this->database;
            }

            $this->conn = new PDO(
                $dsn,
                $this->username,
                $this->password,
                [
                    PDO::ATTR_PERSISTENT => true,
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                ]
            );
            $this->conn->exec("set names utf8");
        } catch(PDOException $exception) {
            $errorMsg = "Connection error: " . $exception->getMessage();
            error_log($errorMsg);
            echo $errorMsg;
        }

        return $this->conn;
    }

    public function getDatabaseName() {
        return $this->database;
    }

    public function getHealthStatus() {
        try {
            $conn = $this->getConnection();
            if ($conn === null) {
                return [
                    'status' => 'unhealthy',
                    'message' => 'Connection failed'
                ];
            }

            $stmt = $conn->query("SELECT 1");
            if ($stmt) {
                $sizeStmt = $conn->query("SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size FROM information_schema.tables WHERE table_schema = '{$this->database}'");
                $sizeResult = $sizeStmt->fetch(PDO::FETCH_ASSOC);
                $size = $sizeResult['size'] ?? 0;

                $versionStmt = $conn->query("SELECT VERSION() as version");
                $versionResult = $versionStmt->fetch(PDO::FETCH_ASSOC);
                $version = $versionResult['version'] ?? 'unknown';

                return [
                    'status' => 'healthy',
                    'message' => 'Connected',
                    'size_mb' => $size,
                    'version' => $version,
                    'host' => $this->host,
                    'port' => $this->port
                ];
            }

            return [
                'status' => 'unhealthy',
                'message' => 'Query failed'
            ];
        } catch (Exception $e) {
            return [
                'status' => 'unhealthy',
                'message' => $e->getMessage()
            ];
        }
    }
}
