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
    }
    public $conn;

    public function getConnection($withoutDatabase = false) {
        $this->conn = null;
        
        try {
            $dsn = "mysql:host=" . $this->host . ";port=" . $this->port;
            if (!$withoutDatabase) {
                $dsn .= ";dbname=" . $this->database;
            }
            
            $this->conn = new PDO(
                $dsn,
                $this->username,
                $this->password
            );
            $this->conn->exec("set names utf8");
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }
        
        return $this->conn;
    }

    public function getDatabaseName() {
        return $this->database;
    }
}
