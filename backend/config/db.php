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
        $this->host = getenv('DB_HOST');
        $this->username = getenv('DB_USERNAME');
        $this->password = getenv('DB_PASSWORD');
        $this->database = getenv('DB_DATABASE');
        $this->port = getenv('DB_PORT');
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
