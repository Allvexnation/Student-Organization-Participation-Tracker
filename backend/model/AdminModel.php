<?php

require_once __DIR__ . '/../config/db.php';

class AdminModel {
    private $conn;
    private $table_name = "admins";

    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
    }

    public function create($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (profile_photo, name, username, email, password, role) 
                  VALUES (:profile_photo, :name, :username, :email, :password, :role)";

        try {
            $stmt = $this->conn->prepare($query);
            
            $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
            
            $null = null;
            if (isset($data['profile_photo']) && !empty($data['profile_photo'])) {
                $stmt->bindParam(':profile_photo', $data['profile_photo'], PDO::PARAM_LOB);
            } else {
                $stmt->bindParam(':profile_photo', $null, PDO::PARAM_NULL);
            }
            $stmt->bindParam(':name', $data['name']);
            $stmt->bindParam(':username', $data['username']);
            $stmt->bindParam(':email', $data['email']);
            $stmt->bindParam(':password', $hashedPassword);
            $stmt->bindParam(':role', $data['role']);
            
            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        } catch(PDOException $e) {
            echo "Error creating admin: " . $e->getMessage();
            return false;
        }
    }

    public function readAll() {
        $query = "SELECT id, profile_photo, name, username, email, role, updated_at, created_at 
                  FROM " . $this->table_name . " 
                  ORDER BY created_at DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            echo "Error reading admins: " . $e->getMessage();
            return false;
        }
    }

    public function readOne($id) {
        $query = "SELECT id, profile_photo, name, username, email, role, updated_at, created_at 
                  FROM " . $this->table_name . " 
                  WHERE id = :id 
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            echo "Error reading admin: " . $e->getMessage();
            return false;
        }
    }

    public function readByUsername($username) {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE username = :username 
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':username', $username);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            echo "Error reading admin by username: " . $e->getMessage();
            return false;
        }
    }

    public function readByEmail($email) {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE email = :email 
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':email', $email);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            echo "Error reading admin by email: " . $e->getMessage();
            return false;
        }
    }

    public function update($id, $data) {
        $query = "UPDATE " . $this->table_name . " 
                  SET profile_photo = :profile_photo, 
                      name = :name, 
                      username = :username, 
                      email = :email, 
                      role = :role";
        
        if(isset($data['password']) && !empty($data['password'])) {
            $query .= ", password = :password";
        }
        
        $query .= " WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            
            $null = null;
            if (isset($data['profile_photo']) && !empty($data['profile_photo'])) {
                $stmt->bindParam(':profile_photo', $data['profile_photo'], PDO::PARAM_LOB);
            } else {
                $stmt->bindParam(':profile_photo', $null, PDO::PARAM_NULL);
            }
            $stmt->bindParam(':name', $data['name']);
            $stmt->bindParam(':username', $data['username']);
            $stmt->bindParam(':email', $data['email']);
            $stmt->bindParam(':role', $data['role']);
            $stmt->bindParam(':id', $id);
            
            if(isset($data['password']) && !empty($data['password'])) {
                $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
                $stmt->bindParam(':password', $hashedPassword);
            }
            
            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            echo "Error updating admin: " . $e->getMessage();
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
            echo "Error deleting admin: " . $e->getMessage();
            return false;
        }
    }

    public function verifyLogin($usernameOrEmail, $password) {
        $admin = $this->readByUsername($usernameOrEmail);
        
        if (!$admin) {
            $admin = $this->readByEmail($usernameOrEmail);
        }
        
        if($admin && password_verify($password, $admin['password'])) {
            return $admin;
        }
        
        return false;
    }
}
