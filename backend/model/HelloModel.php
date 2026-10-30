<?php

require_once __DIR__ . '/../config/db.php';

class HelloModel {
    private $conn;
    private $table = 'hellos';

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    /**
     * Get all records
     */
    public function readAll() {
        $query = "SELECT * FROM " . $this->table;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get single record by ID
     */
    public function readOne($id) {
        $query = "SELECT * FROM " . $this->table . " WHERE id = :id LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Create new record
     */
    public function create($data) {
        $query = "INSERT INTO " . $this->table . " SET ";

        $fields = array_keys($data);
        $placeholders = array_map(function($field) { return ':' . $field; }, $fields);

        $query .= implode(', ', array_map(function($field) { return $field . ' = :' . $field; }, $fields));

        $stmt = $this->conn->prepare($query);

        foreach ($data as $key => $value) {
            $stmt->bindParam(':' . $key, $value);
        }

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }

        return false;
    }

    /**
     * Update record
     */
    public function update($id, $data) {
        $query = "UPDATE " . $this->table . " SET ";

        $fields = array_keys($data);
        $query .= implode(', ', array_map(function($field) { return $field . ' = :' . $field; }, $fields));
        $query .= " WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        foreach ($data as $key => $value) {
            $stmt->bindParam(':' . $key, $value);
        }

        $stmt->bindParam(':id', $id);

        if ($stmt->execute()) {
            return true;
        }

        return false;
    }

    /**
     * Delete record
     */
    public function delete($id) {
        $query = "DELETE FROM " . $this->table . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);

        if ($stmt->execute()) {
            return true;
        }

        return false;
    }
}
