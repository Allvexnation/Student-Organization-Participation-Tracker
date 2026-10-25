<?php

require_once __DIR__ . '/../config/db.php';

class OrgMembershipsModel {
    private $conn;
    private $table_name = "organization_memberships";

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
        if (!$this->conn) {
            error_log("Failed to establish database connection in OrgMembershipsModel");
        }
    }

    public function create($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (organization_id, student_id, date_joined, role_id, membership_status) 
                  VALUES (:organization_id, :student_id, :date_joined, :role_id, :membership_status)";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':organization_id', $data['organization_id']);
            $stmt->bindParam(':student_id', $data['student_id']);
            $stmt->bindParam(':date_joined', $data['date_joined']);
            $stmt->bindParam(':role_id', $data['role_id']);
            $stmt->bindParam(':membership_status', $data['membership_status']);
            
            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        } catch(PDOException $e) {
            echo "Error creating organization membership: " . $e->getMessage();
            return false;
        }
    }

    public function readAll() {
        if (!$this->conn) {
            error_log("Database connection is null");
            return false;
        }

        $query = "SELECT om.*, 
                         s.first_name, s.last_name,
                         o.name as organization_name,
                         r.role_name
                  FROM " . $this->table_name . " om
                  LEFT JOIN students s ON om.student_id = s.id
                  LEFT JOIN organizations o ON om.organization_id = o.id
                  LEFT JOIN roles r ON om.role_id = r.id
                  ORDER BY om.created_at DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($results as &$result) {
                $result['student_name'] = $result['first_name'] . ' ' . $result['last_name'];
            }

            return $results;
        } catch(PDOException $e) {
            error_log("Error reading organization memberships: " . $e->getMessage());
            return false;
        }
    }

    public function readOne($id) {
        $query = "SELECT om.*, 
                         s.first_name, s.last_name,
                         o.name as organization_name,
                         r.role_name
                  FROM " . $this->table_name . " om
                  LEFT JOIN students s ON om.student_id = s.id
                  LEFT JOIN organizations o ON om.organization_id = o.id
                  LEFT JOIN roles r ON om.role_id = r.id
                  WHERE om.id = :id 
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                $result['student_name'] = $result['first_name'] . ' ' . $result['last_name'];
            }
            
            return $result;
        } catch(PDOException $e) {
            echo "Error reading organization membership: " . $e->getMessage();
            return false;
        }
    }

    public function update($id, $data) {
        $query = "UPDATE " . $this->table_name . " 
                  SET organization_id = :organization_id, 
                      student_id = :student_id, 
                      date_joined = :date_joined, 
                      role_id = :role_id, 
                      membership_status = :membership_status 
                  WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':organization_id', $data['organization_id']);
            $stmt->bindParam(':student_id', $data['student_id']);
            $stmt->bindParam(':date_joined', $data['date_joined']);
            $stmt->bindParam(':role_id', $data['role_id']);
            $stmt->bindParam(':membership_status', $data['membership_status']);
            $stmt->bindParam(':id', $id);
            
            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            echo "Error updating organization membership: " . $e->getMessage();
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
            echo "Error deleting organization membership: " . $e->getMessage();
            return false;
        }
    }
}
