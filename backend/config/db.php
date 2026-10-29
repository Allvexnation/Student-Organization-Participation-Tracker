<?php

require_once __DIR__ . '/env.php';

loadEnv(__DIR__ . '/../.env');

class Database {
    private $host;
    private $username;
    private $password;
    private $database;
    private $port;

    public function __construct() {
        $connection = getenv('DB_CONNECTION');

        if ($connection === 'Production') {
            // Production credentials
            $this->host = getenv('PROD_DB_HOST');
            $this->username = getenv('PROD_DB_USERNAME');
            $this->password = getenv('PROD_DB_PASSWORD');
            $this->database = getenv('PROD_DB_DATABASE');
            $this->port = getenv('PROD_DB_PORT');
        } else {
            // Development credentials (default)
            $this->host = getenv('DEV_DB_HOST');
            $this->username = getenv('DEV_DB_USERNAME');
            $this->password = getenv('DEV_DB_PASSWORD');
            $this->database = getenv('DEV_DB_DATABASE');
            $this->port = getenv('DEV_DB_PORT');
        }

        // Log configuration for debugging
        error_log("DB Connection Mode: " . ($connection ?: 'not set'));
        error_log("DB Host: " . ($this->host ?: 'not set'));
        error_log("DB Database: " . ($this->database ?: 'not set'));
        error_log("DB Port: " . ($this->port ?: 'not set'));
    }
    public $conn;

    public function getConnection($withoutDatabase = false) {
        $this->conn = null;

        try {
            $dsn = "mysql:host=" . $this->host . ";port=" . $this->port;
            if (!$withoutDatabase) {
                $dsn .= ";dbname=" . $this->database;
            }

            error_log("Attempting connection with DSN: " . $dsn);

            $this->conn = new PDO(
                $dsn,
                $this->username,
                $this->password
            );
            $this->conn->exec("set names utf8");
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            error_log("Database connection successful");
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
}
