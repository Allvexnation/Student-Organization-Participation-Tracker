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
                  LEFT JOIN organizations o ON o.id = (SELECT eo.organization_id FROM event_organizations eo WHERE eo.event_id = e.id LIMIT 1)
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
                  LEFT JOIN organizations o ON o.id = (SELECT eo.organization_id FROM event_organizations eo WHERE eo.event_id = e.id LIMIT 1)
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
                  LEFT JOIN organizations o ON o.id = (SELECT eo.organization_id FROM event_organizations eo WHERE eo.event_id = e.id LIMIT 1)
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

    public function getByStudentId($student_id) {
        if (!$this->conn) {
            error_log("Database connection is null");
            return false;
        }

        $query = "SELECT DISTINCT e.id, e.title, e.description, e.event_day_start, e.event_day_end, e.venue, e.event_category
                  FROM events e
                  INNER JOIN event_organizations eo ON eo.event_id = e.id
                  WHERE eo.organization_id IN (
                      SELECT organization_id 
                      FROM organization_memberships 
                      WHERE student_id = :student_id AND membership_status = 'active'
                  )
                  ORDER BY e.event_day_start DESC";

        try {
            error_log("Executing query for student_id: $student_id using event_organizations");
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':student_id', $student_id);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            error_log("Events found for student $student_id: " . count($results));
            error_log("Student ID type: " . gettype($student_id));
            if (!empty($results)) {
                error_log("First event ID: " . $results[0]['id'] . ", Title: " . $results[0]['title']);
            }
            return $results;
        } catch(PDOException $e) {
            error_log("Error reading events by student: " . $e->getMessage());
            return false;
        }
    }

    public function getUpcomingByStudentId($student_id) {
        if (!$this->conn) {
            error_log("Database connection is null");
            return false;
        }

        $currentDate = date('Y-m-d');

        $query = "SELECT er.id, er.event_id, er.student_id, er.registered_at,
                         e.id, e.title, e.description, e.event_day_start, e.event_day_end, e.venue, e.event_category,
                         o.name as organization_name
                  FROM " . $this->table_name . " er
                  LEFT JOIN events e ON er.event_id = e.id
                  LEFT JOIN organizations o ON o.id = (SELECT eo.organization_id FROM event_organizations eo WHERE eo.event_id = e.id LIMIT 1)
                  WHERE er.student_id = :student_id AND e.event_day_start >= :current_date
                  ORDER BY e.event_day_start ASC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':student_id', $student_id);
            $stmt->bindParam(':current_date', $currentDate);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return $results;
        } catch(PDOException $e) {
            error_log("Error reading upcoming events by student: " . $e->getMessage());
            return false;
        }
    }
}
