<?php

require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../utils/CredentialGenerator.php';

class StudentsModel {
    private $conn;
    private $table_name = "students";

    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
        if (!$this->conn) {
            error_log("Failed to establish database connection in StudentsModel");
        }
    }

    public function create($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (profile_photo, student_number, first_name, last_name, program, year_level, username, email, password) 
                  VALUES (:profile_photo, :student_number, :first_name, :last_name, :program, :year_level, :username, :email, :password)";

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
            $stmt->bindParam(':student_number', $data['student_number']);
            $stmt->bindParam(':first_name', $data['first_name']);
            $stmt->bindParam(':last_name', $data['last_name']);
            $stmt->bindParam(':program', $data['program']);
            $stmt->bindParam(':year_level', $data['year_level']);
            $stmt->bindParam(':username', $data['username']);
            $stmt->bindParam(':email', $data['email']);
            $stmt->bindParam(':password', $hashedPassword);
            
            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        } catch(PDOException $e) {
            echo "Error creating student: " . $e->getMessage();
            return false;
        }
    }

    public function readAll() {
        if (!$this->conn) {
            error_log("Database connection is null");
            return false;
        }

        $query = "SELECT id, profile_photo, student_number, first_name, last_name, program, year_level, username, email, updated_at, created_at
                  FROM " . $this->table_name . "
                  ORDER BY created_at DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($results as &$student) {
                if (isset($student['profile_photo']) && !empty($student['profile_photo'])) {
                    if (!str_starts_with($student['profile_photo'], 'data:')) {
                        $student['profile_photo'] = 'data:image/jpeg;base64,' . base64_encode($student['profile_photo']);
                    }
                }
            }

            return $results;
        } catch(PDOException $e) {
            error_log("Error reading students: " . $e->getMessage());
            return false;
        }
    }

    public function readOne($id) {
        $query = "SELECT id, profile_photo, student_number, first_name, last_name, program, year_level, username, email, updated_at, created_at 
                  FROM " . $this->table_name . " 
                  WHERE id = :id 
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result && isset($result['profile_photo']) && !empty($result['profile_photo'])) {
                if (!str_starts_with($result['profile_photo'], 'data:')) {
                    $result['profile_photo'] = 'data:image/jpeg;base64,' . base64_encode($result['profile_photo']);
                }
            }
            
            return $result;
        } catch(PDOException $e) {
            echo "Error reading student: " . $e->getMessage();
            return false;
        }
    }

    public function readByStudentNumber($student_number) {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE student_number = :student_number 
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':student_number', $student_number);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            echo "Error reading student by student number: " . $e->getMessage();
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
            echo "Error reading student by username: " . $e->getMessage();
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
            echo "Error reading student by email: " . $e->getMessage();
            return false;
        }
    }

    public function update($id, $data) {

        $existingStudent = $this->readOne($id);
        
        $query = "UPDATE " . $this->table_name . " 
                  SET profile_photo = :profile_photo, 
                      student_number = :student_number, 
                      first_name = :first_name, 
                      last_name = :last_name, 
                      program = :program, 
                      year_level = :year_level,
                      username = :username,
                      email = :email";
        
        if(isset($data['password']) && !empty($data['password'])) {
            $query .= ", password = :password";
        }
        
        $query .= " WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            
            $null = null;
            if (isset($data['profile_photo']) && !empty($data['profile_photo'])) {
                if (is_string($data['profile_photo']) && strpos($data['profile_photo'], 'data:image') === 0) {
                    $parts = explode(',', $data['profile_photo']);
                    if (isset($parts[1])) {
                        $photoData = base64_decode($parts[1]);
                        $stmt->bindParam(':profile_photo', $photoData, PDO::PARAM_LOB);
                    } else {
                        $stmt->bindParam(':profile_photo', $null, PDO::PARAM_NULL);
                    }
                } else if (is_string($data['profile_photo']) && preg_match('/^[a-zA-Z0-9\/\r\n+]*={0,2}$/', $data['profile_photo']) && base64_decode($data['profile_photo'], true) !== false) {
                    $photoData = base64_decode($data['profile_photo']);
                    $stmt->bindParam(':profile_photo', $photoData, PDO::PARAM_LOB);
                } else {
                    $stmt->bindParam(':profile_photo', $data['profile_photo'], PDO::PARAM_LOB);
                }
            } elseif ($existingStudent && isset($existingStudent['profile_photo']) && !empty($existingStudent['profile_photo'])) {
                if (is_string($existingStudent['profile_photo']) && strpos($existingStudent['profile_photo'], 'data:image') === 0) {
                    $parts = explode(',', $existingStudent['profile_photo']);
                    $photoData = isset($parts[1]) ? base64_decode($parts[1]) : null;
                    $stmt->bindParam(':profile_photo', $photoData, PDO::PARAM_LOB);
                } else {
                    $stmt->bindParam(':profile_photo', $existingStudent['profile_photo'], PDO::PARAM_LOB);
                }
            } else {
                $stmt->bindParam(':profile_photo', $null, PDO::PARAM_NULL);
            }
            
            // Check if required fields exist
            if (!isset($data['student_number'])) {
                error_log("Missing student_number in update data");
                return false;
            }
            if (!isset($data['first_name'])) {
                error_log("Missing first_name in update data");
                return false;
            }
            if (!isset($data['last_name'])) {
                error_log("Missing last_name in update data");
                return false;
            }
            if (!isset($data['program'])) {
                error_log("Missing program in update data");
                return false;
            }
            if (!isset($data['year_level'])) {
                error_log("Missing year_level in update data");
                return false;
            }
            if (!isset($data['username'])) {
                error_log("Missing username in update data");
                return false;
            }
            if (!isset($data['email'])) {
                error_log("Missing email in update data");
                return false;
            }
            
            $stmt->bindParam(':student_number', $data['student_number']);
            $stmt->bindParam(':first_name', $data['first_name']);
            $stmt->bindParam(':last_name', $data['last_name']);
            $stmt->bindParam(':program', $data['program']);
            $stmt->bindParam(':year_level', $data['year_level']);
            $stmt->bindParam(':username', $data['username']);
            $stmt->bindParam(':email', $data['email']);
            $stmt->bindParam(':id', $id);
            
            if(isset($data['password']) && !empty($data['password'])) {
                $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
                $stmt->bindParam(':password', $hashedPassword);
            }
            
            error_log("Executing update query for student ID: " . $id);
            if($stmt->execute()) {
                error_log("Update query executed successfully");
                return true;
            }
            error_log("Update query execution failed");
            error_log("PDO Error info: " . json_encode($stmt->errorInfo()));
            return false;
        } catch(PDOException $e) {
            error_log("PDOException updating student: " . $e->getMessage());
            echo "Error updating student: " . $e->getMessage();
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
            echo "Error deleting student: " . $e->getMessage();
            return false;
        }
    }

    public function generateUniqueUsername($firstName, $lastName) {
        $fullName = $firstName . ' ' . $lastName;
        return CredentialGenerator::generateUniqueUsername($fullName, [$this, 'usernameExists']);
    }

    public function usernameExists($username) {
        $query = "SELECT id FROM " . $this->table_name . " WHERE username = :username LIMIT 1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':username', $username);
            $stmt->execute();
            return $stmt->fetch() !== false;
        } catch(PDOException $e) {
            error_log("Error checking username existence: " . $e->getMessage());
            return false;
        }
    }

    public function generateSecurePassword() {
        return CredentialGenerator::generateSecurePassword(8);
    }

    public function verifyLogin($usernameOrEmail, $password) {
        $student = $this->readByUsername($usernameOrEmail);
        
        if (!$student) {
            $student = $this->readByEmail($usernameOrEmail);
        }
        
        if($student && password_verify($password, $student['password'])) {
            return $student;
        }
        
        return false;
    }

    public function findByUsernameOrEmail($usernameOrEmail) {
        $student = $this->readByUsername($usernameOrEmail);
        
        if (!$student) {
            $student = $this->readByEmail($usernameOrEmail);
        }
        
        return $student;
    }

    public function resetPassword($studentId, $newPassword) {
        $query = "UPDATE " . $this->table_name . " 
                  SET password = :password 
                  WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            
            $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
            $stmt->bindParam(':password', $hashedPassword);
            $stmt->bindParam(':id', $studentId);
            
            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error resetting password: " . $e->getMessage());
            return false;
        }
    }
}
