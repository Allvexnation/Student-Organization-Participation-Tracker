<?php

require_once __DIR__ . '/../config/db.php';

class OrganizationsModel {
    private $conn;
    private $table_name = "organizations";

    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
        if (!$this->conn) {
            error_log("Failed to establish database connection in OrganizationsModel");
        }
    }

    public function create($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (org_code, name, description, adviser_id, status) 
                  VALUES (:org_code, :name, :description, :adviser_id, :status)";

        try {
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':org_code', $data['org_code']);
            $stmt->bindParam(':name', $data['name']);
            $stmt->bindParam(':description', $data['description']);
            $adviser_id = isset($data['adviser_id']) && $data['adviser_id'] !== '' ? $data['adviser_id'] : null;
            $stmt->bindParam(':adviser_id', $adviser_id);
            $stmt->bindParam(':status', $data['status']);
            
            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        } catch(PDOException $e) {
            echo "Error creating organization: " . $e->getMessage();
            return false;
        }
    }

    public function readAll() {
        if (!$this->conn) {
            error_log("Database connection is null");
            return false;
        }

        $query = "SELECT o.id, o.org_code, o.name, o.description, o.adviser_id, a.name as adviser, o.status, o.updated_at, o.created_at
                  FROM " . $this->table_name . " o
                  LEFT JOIN advisers a ON o.adviser_id = a.id
                  ORDER BY o.created_at DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return $results;
        } catch(PDOException $e) {
            error_log("Error reading organizations: " . $e->getMessage());
            return false;
        }
    }

    public function readOne($id) {
        $query = "SELECT o.id, o.org_code, o.name, o.description, o.adviser_id, a.name as adviser, o.status, o.updated_at, o.created_at 
                  FROM " . $this->table_name . " o
                  LEFT JOIN advisers a ON o.adviser_id = a.id
                  WHERE o.id = :id 
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $result;
        } catch(PDOException $e) {
            echo "Error reading organization: " . $e->getMessage();
            return false;
        }
    }

    public function readByOrgCode($org_code) {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE org_code = :org_code 
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':org_code', $org_code);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            echo "Error reading organization by org code: " . $e->getMessage();
            return false;
        }
    }

    public function getByAdviserId($adviserId) {
        $query = "SELECT o.id, o.org_code, o.name, o.description, o.adviser_id, a.name as adviser, o.status, o.updated_at, o.created_at
                  FROM " . $this->table_name . " o
                  LEFT JOIN advisers a ON o.adviser_id = a.id
                  WHERE o.adviser_id = :adviser_id
                  ORDER BY o.created_at DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':adviser_id', $adviserId);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return $results;
        } catch(PDOException $e) {
            error_log("Error reading organizations by adviser: " . $e->getMessage());
            return false;
        }
    }

    public function update($id, $data) {
        $query = "UPDATE " . $this->table_name . " 
                  SET org_code = :org_code, 
                      name = :name, 
                      description = :description, 
                      adviser_id = :adviser_id,
                      status = :status
                  WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':org_code', $data['org_code']);
            $stmt->bindParam(':name', $data['name']);
            $stmt->bindParam(':description', $data['description']);
            $adviser_id = isset($data['adviser_id']) && $data['adviser_id'] !== '' ? $data['adviser_id'] : null;
            $stmt->bindParam(':adviser_id', $adviser_id);
            $stmt->bindParam(':status', $data['status']);
            $stmt->bindParam(':id', $id);
            
            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            echo "Error updating organization: " . $e->getMessage();
            return false;
        }
    }

    public function delete($id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            
            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            echo "Error deleting organization: " . $e->getMessage();
            return false;
        }
    }
}
