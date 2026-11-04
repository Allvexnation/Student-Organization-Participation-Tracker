<?php

require_once __DIR__ . '/../config/db.php';

class RoleModel {
    private $conn;
    private $table_name = "roles";
    private $students_table = "students";

    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
        if (!$this->conn) {
            error_log("Failed to establish database connection in RoleModel");
        }
    }

    public function create($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (role_name) 
                  VALUES (:role_name)";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':role_name', $data['role_name']);
            
            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        } catch(PDOException $e) {
            echo "Error creating role: " . $e->getMessage();
            return false;
        }
    }

    public function readAll() {
        if (!$this->conn) {
            error_log("Database connection is null");
            return false;
        }

        $query = "SELECT id, role_name, updated_at, created_at
                  FROM " . $this->table_name . "
                  ORDER BY created_at DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($results as &$role) {
                $role['users'] = $this->getUsersByRoleName($role['role_name']);
            }

            return $results;
        } catch(PDOException $e) {
            error_log("Error reading roles: " . $e->getMessage());
            return false;
        }
    }

    public function readOne($id) {
        $query = "SELECT id, role_name, updated_at, created_at 
                  FROM " . $this->table_name . " 
                  WHERE id = :id 
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                $result['users'] = $this->getUsersByRoleName($result['role_name']);
            }
            
            return $result;
        } catch(PDOException $e) {
            echo "Error reading role: " . $e->getMessage();
            return false;
        }
    }

    public function readByRoleName($role_name) {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE role_name = :role_name 
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':role_name', $role_name);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            echo "Error reading role by name: " . $e->getMessage();
            return false;
        }
    }

    private function getUsersByRoleName($role_name) {

        $query = "SELECT id FROM " . $this->table_name . " WHERE role_name = :role_name LIMIT 1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':role_name', $role_name);
            $stmt->execute();
            $role = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$role) {
                return [];
            }

            $role_id = $role['id'];

            $query = "SELECT s.id, s.first_name, s.last_name, s.username, s.email, o.name as organization_name
                      FROM organization_memberships om
                      LEFT JOIN students s ON om.student_id = s.id
                      LEFT JOIN organizations o ON om.organization_id = o.id
                      WHERE om.role_id = :role_id
                      ORDER BY s.first_name ASC";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':role_id', $role_id);
            $stmt->execute();
            $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($students as &$student) {
                $student['name'] = $student['first_name'] . ' ' . $student['last_name'];
            }

            return $students;
        } catch(PDOException $e) {
            error_log("Error reading users by role: " . $e->getMessage());
            return [];
        }
    }

    public function update($id, $data) {
        $query = "UPDATE " . $this->table_name . " 
                  SET role_name = :role_name 
                  WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':role_name', $data['role_name']);
            $stmt->bindParam(':id', $id);
            
            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            echo "Error updating role: " . $e->getMessage();
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
            echo "Error deleting role: " . $e->getMessage();
            return false;
        }
    }
}
