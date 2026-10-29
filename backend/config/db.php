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
}
