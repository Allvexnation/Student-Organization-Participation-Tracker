<?php

require_once __DIR__ . '/../config/db.php';

class EventRegistrationsModel {
    private $conn;
    private $table_name = "event_registrations";

    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
        if (!$this->conn) {
            error_log("Failed to establish database connection in EventRegistrationsModel");
        }
    }

    public function create($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (event_id, student_id) 
                  VALUES (:event_id, :student_id)";

        try {
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':event_id', $data['event_id']);
            $stmt->bindParam(':student_id', $data['student_id']);
            
            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        } catch(PDOException $e) {
            echo "Error creating event registration: " . $e->getMessage();
            return false;
        }
    }

    public function readAll() {
        if (!$this->conn) {
            error_log("Database connection is null");
            return false;
        }

        $query = "SELECT er.id, er.event_id, er.student_id, er.registered_at, er.updated_at, er.created_at, 
                         e.title as event_title, CONCAT(s.first_name, ' ', s.last_name) as student_name, o.name as organization_name
                  FROM " . $this->table_name . " er
                  LEFT JOIN events e ON er.event_id = e.id
                  LEFT JOIN students s ON er.student_id = s.id
                  LEFT JOIN organizations o ON e.organization_id = o.id
                  ORDER BY er.registered_at DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return $results;
        } catch(PDOException $e) {
            error_log("Error reading event registrations: " . $e->getMessage());
            return false;
        }
    }

    public function readOne($id) {
        $query = "SELECT er.id, er.event_id, er.student_id, er.registered_at, er.updated_at, er.created_at, 
                         e.title as event_title, CONCAT(s.first_name, ' ', s.last_name) as student_name, o.name as organization_name
                  FROM " . $this->table_name . " er
                  LEFT JOIN events e ON er.event_id = e.id
                  LEFT JOIN students s ON er.student_id = s.id
                  LEFT JOIN organizations o ON e.organization_id = o.id
                  WHERE er.id = :id 
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $result;
        } catch(PDOException $e) {
            echo "Error reading event registration: " . $e->getMessage();
            return false;
        }
    }

    public function update($id, $data) {
        $query = "UPDATE " . $this->table_name . " 
                  SET event_id = :event_id, 
                      student_id = :student_id
                  WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':event_id', $data['event_id']);
            $stmt->bindParam(':student_id', $data['student_id']);
            $stmt->bindParam(':id', $id);
            
            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            echo "Error updating event registration: " . $e->getMessage();
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
            echo "Error deleting event registration: " . $e->getMessage();
            return false;
        }
    }

    public function getByEventId($eventId) {
        $query = "SELECT er.id, er.event_id, er.student_id, er.registered_at, er.updated_at, er.created_at, 
                         e.title as event_title, CONCAT(s.first_name, ' ', s.last_name) as student_name, o.name as organization_name
                  FROM " . $this->table_name . " er
                  LEFT JOIN events e ON er.event_id = e.id
                  LEFT JOIN students s ON er.student_id = s.id
                  LEFT JOIN organizations o ON e.organization_id = o.id
                  WHERE er.event_id = :event_id
                  ORDER BY er.registered_at DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':event_id', $eventId);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return $results;
        } catch(PDOException $e) {
            error_log("Error reading event registrations by event: " . $e->getMessage());
            return false;
        }
    }
}
