<?php

require_once __DIR__ . '/../config/db.php';

class EventsModel {
    private $conn;
    private $table_name = "events";

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
        if (!$this->conn) {
            error_log("Failed to establish database connection in EventsModel");
        }
    }

    public function create($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (organization_id, title, description, event_date, venue, event_category) 
                  VALUES (:organization_id, :title, :description, :event_date, :venue, :event_category)";

        try {
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':organization_id', $data['organization_id']);
            $stmt->bindParam(':title', $data['title']);
            $stmt->bindParam(':description', $data['description']);
            $stmt->bindParam(':event_date', $data['event_date']);
            $stmt->bindParam(':venue', $data['venue']);
            $stmt->bindParam(':event_category', $data['event_category']);
            
            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        } catch(PDOException $e) {
            echo "Error creating event: " . $e->getMessage();
            return false;
        }
    }

    public function readAll() {
        if (!$this->conn) {
            error_log("Database connection is null");
            return false;
        }

        $query = "SELECT e.id, e.organization_id, e.title, e.description, e.event_date, e.venue, e.event_category, e.updated_at, e.created_at, o.name as organization_name
                  FROM " . $this->table_name . " e
                  LEFT JOIN organizations o ON e.organization_id = o.id
                  ORDER BY e.event_date DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return $results;
        } catch(PDOException $e) {
            error_log("Error reading events: " . $e->getMessage());
            return false;
        }
    }

    public function readOne($id) {
        $query = "SELECT e.id, e.organization_id, e.title, e.description, e.event_date, e.venue, e.event_category, e.updated_at, e.created_at, o.name as organization_name
                  FROM " . $this->table_name . " e
                  LEFT JOIN organizations o ON e.organization_id = o.id
                  WHERE e.id = :id 
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $result;
        } catch(PDOException $e) {
            echo "Error reading event: " . $e->getMessage();
            return false;
        }
    }

    public function update($id, $data) {
        $query = "UPDATE " . $this->table_name . " 
                  SET organization_id = :organization_id, 
                      title = :title, 
                      description = :description, 
                      event_date = :event_date,
                      venue = :venue,
                      event_category = :event_category
                  WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':organization_id', $data['organization_id']);
            $stmt->bindParam(':title', $data['title']);
            $stmt->bindParam(':description', $data['description']);
            $stmt->bindParam(':event_date', $data['event_date']);
            $stmt->bindParam(':venue', $data['venue']);
            $stmt->bindParam(':event_category', $data['event_category']);
            $stmt->bindParam(':id', $id);
            
            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            echo "Error updating event: " . $e->getMessage();
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
            echo "Error deleting event: " . $e->getMessage();
            return false;
        }
    }
}
