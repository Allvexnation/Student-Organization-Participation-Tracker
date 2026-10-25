<?php

require_once __DIR__ . '/../config/db.php';

class AdviserModel {
    private $conn;
    private $table_name = "advisers";

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
        if (!$this->conn) {
            error_log("Failed to establish database connection in AdviserModel");
        }
    }

    public function create($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (profile_photo, name, username, email, password, role, status) 
                  VALUES (:profile_photo, :name, :username, :email, :password, :role, :status)";

        try {
            $stmt = $this->conn->prepare($query);
            
            $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
            
            $null = null;
            if (isset($data['profile_photo']) && !empty($data['profile_photo'])) {
                if (strpos($data['profile_photo'], 'data:image') === 0) {
                    $parts = explode(',', $data['profile_photo']);
                    if (isset($parts[1])) {
                        $photoData = base64_decode($parts[1]);
                        $stmt->bindParam(':profile_photo', $photoData, PDO::PARAM_LOB);
                    } else {
                        $stmt->bindParam(':profile_photo', $null, PDO::PARAM_NULL);
                    }
                } else {
                    $photoData = base64_decode($data['profile_photo']);
                    $stmt->bindParam(':profile_photo', $photoData, PDO::PARAM_LOB);
                }
            } else {
                $stmt->bindParam(':profile_photo', $null, PDO::PARAM_NULL);
            }
            $stmt->bindParam(':name', $data['name']);
            $stmt->bindParam(':username', $data['username']);
            $stmt->bindParam(':email', $data['email']);
            $stmt->bindParam(':password', $hashedPassword);
            $stmt->bindParam(':role', $data['role']);
            $stmt->bindParam(':status', $data['status']);
            
            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        } catch(PDOException $e) {
            echo "Error creating adviser: " . $e->getMessage();
            return false;
        }
    }

    public function readAll() {
        if (!$this->conn) {
            error_log("Database connection is null");
            return false;
        }

        $query = "SELECT id, profile_photo, name, username, email, role, status, updated_at, created_at
                  FROM " . $this->table_name . "
                  ORDER BY created_at DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($results as &$adviser) {
                if (isset($adviser['profile_photo']) && !empty($adviser['profile_photo'])) {
                    $adviser['profile_photo'] = 'data:image/jpeg;base64,' . base64_encode($adviser['profile_photo']);
                }
            }

            return $results;
        } catch(PDOException $e) {
            error_log("Error reading advisers: " . $e->getMessage());
            return false;
        }
    }

    public function readOne($id) {
        $query = "SELECT id, profile_photo, name, username, email, role, status, updated_at, created_at 
                  FROM " . $this->table_name . " 
                  WHERE id = :id 
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result && isset($result['profile_photo']) && !empty($result['profile_photo'])) {
                $result['profile_photo'] = 'data:image/jpeg;base64,' . base64_encode($result['profile_photo']);
            }
            
            return $result;
        } catch(PDOException $e) {
            echo "Error reading adviser: " . $e->getMessage();
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
            echo "Error reading adviser by username: " . $e->getMessage();
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
            echo "Error reading adviser by email: " . $e->getMessage();
            return false;
        }
    }

    public function update($id, $data) {
        $query = "UPDATE " . $this->table_name . " 
                  SET profile_photo = :profile_photo, 
                      name = :name, 
                      username = :username, 
                      email = :email, 
                      role = :role,
                      status = :status";
        
        if(isset($data['password']) && !empty($data['password'])) {
            $query .= ", password = :password";
        }
        
        $query .= " WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            
            $null = null;
            if (isset($data['profile_photo']) && !empty($data['profile_photo'])) {
                if (strpos($data['profile_photo'], 'data:image') === 0) {
                    $parts = explode(',', $data['profile_photo']);
                    if (isset($parts[1])) {
                        $photoData = base64_decode($parts[1]);
                        $stmt->bindParam(':profile_photo', $photoData, PDO::PARAM_LOB);
                    } else {
                        $stmt->bindParam(':profile_photo', $null, PDO::PARAM_NULL);
                    }
                } else {
                    $photoData = base64_decode($data['profile_photo']);
                    $stmt->bindParam(':profile_photo', $photoData, PDO::PARAM_LOB);
                }
            } else {
                $stmt->bindParam(':profile_photo', $null, PDO::PARAM_NULL);
            }
            $stmt->bindParam(':name', $data['name']);
            $stmt->bindParam(':username', $data['username']);
            $stmt->bindParam(':email', $data['email']);
            $stmt->bindParam(':role', $data['role']);
            $stmt->bindParam(':status', $data['status']);
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
            echo "Error updating adviser: " . $e->getMessage();
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
            echo "Error deleting adviser: " . $e->getMessage();
            return false;
        }
    }
}
