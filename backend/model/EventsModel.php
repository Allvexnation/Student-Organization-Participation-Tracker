<?php

require_once __DIR__ . '/../config/db.php';

class EventsModel {
    private $conn;
    private $table_name = "events";

    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
        if (!$this->conn) {
            error_log("Failed to establish database connection in EventsModel");
        }
    }

    public function create($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (title, description, event_day_start, event_day_end, venue, event_category, organization_id) 
                  VALUES (:title, :description, :event_day_start, :event_day_end, :venue, :event_category, :organization_id)";

        try {
            $this->conn->beginTransaction();
            
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':title', $data['title']);
            $stmt->bindParam(':description', $data['description']);
            $stmt->bindParam(':event_day_start', $data['event_day_start']);
            $stmt->bindParam(':event_day_end', $data['event_day_end']);
            $stmt->bindParam(':venue', $data['venue']);
            $stmt->bindParam(':event_category', $data['event_category']);
            $orgId = isset($data['organization_ids']) && is_array($data['organization_ids']) && !empty($data['organization_ids']) ? $data['organization_ids'][0] : null;
            $stmt->bindParam(':organization_id', $orgId);
            
            if($stmt->execute()) {
                $eventId = $this->conn->lastInsertId();
                
                // Insert daily schedules
                if (isset($data['daily_schedules']) && is_array($data['daily_schedules'])) {
                    foreach ($data['daily_schedules'] as $schedule) {
                        $scheduleQuery = "INSERT INTO event_daily_schedules (event_id, schedule_date, start_time, end_time) VALUES (:event_id, :schedule_date, :start_time, :end_time)";
                        $scheduleStmt = $this->conn->prepare($scheduleQuery);
                        $scheduleStmt->bindParam(':event_id', $eventId);
                        $scheduleStmt->bindParam(':schedule_date', $schedule['date']);
                        $scheduleStmt->bindParam(':start_time', $schedule['start_time']);
                        $scheduleStmt->bindParam(':end_time', $schedule['end_time']);
                        $scheduleStmt->execute();
                    }
                }
                
                $this->conn->commit();
                return $eventId;
            }
            $this->conn->rollBack();
            return false;
        } catch(PDOException $e) {
            $this->conn->rollBack();
            echo "Error creating event: " . $e->getMessage();
            return false;
        }
    }

    public function readAll() {
        if (!$this->conn) {
            error_log("Database connection is null");
            return false;
        }

        $query = "SELECT e.id, e.title, e.description, e.event_day_start, e.event_day_end, e.venue, e.event_category, e.organization_id, e.updated_at, e.created_at,
                  o.name as organization_name
                  FROM " . $this->table_name . " e
                  LEFT JOIN organizations o ON e.organization_id = o.id
                  ORDER BY e.event_day_start DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Add daily schedules to each event
            foreach ($results as &$event) {
                $scheduleQuery = "SELECT schedule_date, start_time, end_time FROM event_daily_schedules WHERE event_id = :event_id ORDER BY schedule_date";
                $scheduleStmt = $this->conn->prepare($scheduleQuery);
                $scheduleStmt->bindParam(':event_id', $event['id']);
                $scheduleStmt->execute();
                $event['daily_schedules'] = $scheduleStmt->fetchAll(PDO::FETCH_ASSOC);
            }

            return $results;
        } catch(PDOException $e) {
            error_log("Error reading events: " . $e->getMessage());
            return false;
        }
    }

    public function readOne($id) {
        $query = "SELECT e.id, e.title, e.description, e.event_day_start, e.event_day_end, e.venue, e.event_category, e.organization_id, e.updated_at, e.created_at,
                  o.name as organization_name
                  FROM " . $this->table_name . " e
                  LEFT JOIN organizations o ON e.organization_id = o.id
                  WHERE e.id = :id 
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                // Get daily schedules
                $scheduleQuery = "SELECT schedule_date, start_time, end_time FROM event_daily_schedules WHERE event_id = :event_id ORDER BY schedule_date";
                $scheduleStmt = $this->conn->prepare($scheduleQuery);
                $scheduleStmt->bindParam(':event_id', $id);
                $scheduleStmt->execute();
                $result['daily_schedules'] = $scheduleStmt->fetchAll(PDO::FETCH_ASSOC);
            }
            
            return $result;
        } catch(PDOException $e) {
            echo "Error reading event: " . $e->getMessage();
            return false;
        }
    }

    public function update($id, $data) {
        $query = "UPDATE " . $this->table_name . " 
                  SET title = :title, 
                      description = :description, 
                      event_day_start = :event_day_start,
                      event_day_end = :event_day_end,
                      venue = :venue,
                      event_category = :event_category,
                      organization_id = :organization_id
                  WHERE id = :id";

        try {
            $this->conn->beginTransaction();
            
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':title', $data['title']);
            $stmt->bindParam(':description', $data['description']);
            $stmt->bindParam(':event_day_start', $data['event_day_start']);
            $stmt->bindParam(':event_day_end', $data['event_day_end']);
            $stmt->bindParam(':venue', $data['venue']);
            $stmt->bindParam(':event_category', $data['event_category']);
            $orgId = isset($data['organization_ids']) && is_array($data['organization_ids']) && !empty($data['organization_ids']) ? $data['organization_ids'][0] : null;
            $stmt->bindParam(':organization_id', $orgId);
            $stmt->bindParam(':id', $id);
            
            if($stmt->execute()) {
                // Delete existing daily schedules
                $deleteScheduleQuery = "DELETE FROM event_daily_schedules WHERE event_id = :event_id";
                $deleteScheduleStmt = $this->conn->prepare($deleteScheduleQuery);
                $deleteScheduleStmt->bindParam(':event_id', $id);
                $deleteScheduleStmt->execute();
                
                // Insert new daily schedules
                if (isset($data['daily_schedules']) && is_array($data['daily_schedules'])) {
                    foreach ($data['daily_schedules'] as $schedule) {
                        // Skip invalid dates
                        if (!isset($schedule['date']) || $schedule['date'] === '0000-00-00' || $schedule['date'] === '' || empty($schedule['date'])) {
                            continue;
                        }
                        $scheduleQuery = "INSERT INTO event_daily_schedules (event_id, schedule_date, start_time, end_time) VALUES (:event_id, :schedule_date, :start_time, :end_time)";
                        $scheduleStmt = $this->conn->prepare($scheduleQuery);
                        $scheduleStmt->bindParam(':event_id', $id);
                        $scheduleStmt->bindParam(':schedule_date', $schedule['date']);
                        $scheduleStmt->bindParam(':start_time', $schedule['start_time']);
                        $scheduleStmt->bindParam(':end_time', $schedule['end_time']);
                        $scheduleStmt->execute();
                    }
                }
                
                $this->conn->commit();
                return true;
            }
            $this->conn->rollBack();
            return false;
        } catch(PDOException $e) {
            $this->conn->rollBack();
            error_log("Error updating event: " . $e->getMessage());
            if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
                echo "Error updating event: Duplicate schedule date detected. Please check your daily schedules.";
            } else {
                echo "Error updating event: " . $e->getMessage();
            }
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
