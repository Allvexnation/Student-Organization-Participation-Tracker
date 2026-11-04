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
                  (title, description, event_day_start, event_day_end, venue, event_category) 
                  VALUES (:title, :description, :event_day_start, :event_day_end, :venue, :event_category)";

        try {
            $this->conn->beginTransaction();
            
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':title', $data['title']);
            $stmt->bindParam(':description', $data['description']);
            $stmt->bindParam(':event_day_start', $data['event_day_start']);
            $stmt->bindParam(':event_day_end', $data['event_day_end']);
            $stmt->bindParam(':venue', $data['venue']);
            $stmt->bindParam(':event_category', $data['event_category']);
            
            if($stmt->execute()) {
                $eventId = $this->conn->lastInsertId();

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

        $query = "SELECT e.id, e.title, e.description, e.event_day_start, e.event_day_end, e.venue, e.event_category, e.updated_at, e.created_at
                  FROM " . $this->table_name . " e
                  ORDER BY e.event_day_start DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (!empty($results)) {
                $eventIds = array_column($results, 'id');
                $placeholders = implode(',', array_fill(0, count($eventIds), '?'));
                $scheduleQuery = "SELECT event_id, schedule_date, start_time, end_time FROM event_daily_schedules WHERE event_id IN ($placeholders) ORDER BY schedule_date";
                $scheduleStmt = $this->conn->prepare($scheduleQuery);
                $scheduleStmt->execute($eventIds);
                $schedules = $scheduleStmt->fetchAll(PDO::FETCH_ASSOC);

                $schedulesByEvent = [];
                foreach ($schedules as $sched) {
                    $eid = $sched['event_id'];
                    unset($sched['event_id']);
                    $schedulesByEvent[$eid][] = $sched;
                }

                foreach ($results as &$event) {
                    $event['daily_schedules'] = $schedulesByEvent[$event['id']] ?? [];
                }
            }

            return $results;
        } catch(PDOException $e) {
            error_log("Error reading events: " . $e->getMessage());
            return false;
        }
    }

    public function readOne($id) {
        $query = "SELECT e.id, e.title, e.description, e.event_day_start, e.event_day_end, e.venue, e.event_category, e.updated_at, e.created_at
                  FROM " . $this->table_name . " e
                  WHERE e.id = :id 
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                $scheduleQuery = "SELECT schedule_date, start_time, end_time FROM event_daily_schedules WHERE event_id = :event_id ORDER BY schedule_date";
                $scheduleStmt = $this->conn->prepare($scheduleQuery);
                $scheduleStmt->bindParam(':event_id', $id);
                $scheduleStmt->execute();
                $schedules = $scheduleStmt->fetchAll(PDO::FETCH_ASSOC);

                if (empty($schedules) && !empty($result['event_day_start']) && !empty($result['event_day_end'])) {
                    try {
                        $start = new DateTime($result['event_day_start']);
                        $end = new DateTime($result['event_day_end']);
                        $end->modify('+1 day');
                        $period = new DatePeriod($start, new DateInterval('P1D'), $end);

                        $generated = [];
                        foreach ($period as $dt) {
                            $generated[] = [
                                'schedule_date' => $dt->format('Y-m-d'),
                                'start_time' => '08:00:00',
                                'end_time' => '17:00:00'
                            ];
                        }
                        $schedules = $generated;
                    } catch (Exception $e) {

                    }
                }

                $result['daily_schedules'] = $schedules;
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
                      event_category = :event_category
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
            $stmt->bindParam(':id', $id);
            
            if($stmt->execute()) {
                $deleteScheduleQuery = "DELETE FROM event_daily_schedules WHERE event_id = :event_id";
                $deleteScheduleStmt = $this->conn->prepare($deleteScheduleQuery);
                $deleteScheduleStmt->bindParam(':event_id', $id);
                $deleteScheduleStmt->execute();

                if (isset($data['daily_schedules']) && is_array($data['daily_schedules'])) {
                    foreach ($data['daily_schedules'] as $schedule) {
                        
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

    public function getByOrganizationId($organizationId) {
        $query = "SELECT DISTINCT e.id, e.title, e.description, e.event_day_start, e.event_day_end, e.venue, e.event_category, e.updated_at, e.created_at,
                  o.name as organization_name
                  FROM " . $this->table_name . " e
                  INNER JOIN event_organizations eo ON eo.event_id = e.id
                  INNER JOIN organizations o ON eo.organization_id = o.id
                  WHERE eo.organization_id = :organization_id
                  ORDER BY e.event_day_start DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':organization_id', $organizationId);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return $results;
        } catch(PDOException $e) {
            error_log("Error reading events by organization: " . $e->getMessage());
            return false;
        }
    }

    public function readPublicRegistered() {
        if (!$this->conn) {
            error_log("Database connection is null");
            return false;
        }

        $query = "SELECT DISTINCT e.id, e.title, e.description, e.event_day_start, e.event_day_end, e.venue, e.event_category
                  FROM " . $this->table_name . " e
                  INNER JOIN event_organizations eo ON eo.event_id = e.id
                  ORDER BY e.event_day_start DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($results)) {
                return $results;
            }

            $eventIds = array_column($results, 'id');
            $placeholders = implode(',', array_fill(0, count($eventIds), '?'));

            $scheduleQuery = "SELECT event_id, schedule_date, start_time, end_time
                              FROM event_daily_schedules
                              WHERE event_id IN ($placeholders)
                              ORDER BY schedule_date, start_time";
            $scheduleStmt = $this->conn->prepare($scheduleQuery);
            $scheduleStmt->execute($eventIds);
            $schedules = $scheduleStmt->fetchAll(PDO::FETCH_ASSOC);

            $schedulesByEvent = [];
            foreach ($schedules as $sched) {
                $eid = $sched['event_id'];
                unset($sched['event_id']);
                $schedulesByEvent[$eid][] = $sched;
            }

            $orgQuery = "SELECT eo.event_id, o.name AS organization_name
                         FROM event_organizations eo
                         INNER JOIN organizations o ON o.id = eo.organization_id
                         WHERE eo.event_id IN ($placeholders)
                         ORDER BY o.name";
            $orgStmt = $this->conn->prepare($orgQuery);
            $orgStmt->execute($eventIds);
            $organizations = $orgStmt->fetchAll(PDO::FETCH_ASSOC);

            $orgsByEvent = [];
            foreach ($organizations as $org) {
                $eid = $org['event_id'];
                $name = $org['organization_name'];
                if (!$name) {
                    continue;
                }
                if (!isset($orgsByEvent[$eid])) {
                    $orgsByEvent[$eid] = [];
                }
                if (!in_array($name, $orgsByEvent[$eid], true)) {
                    $orgsByEvent[$eid][] = $name;
                }
            }

            foreach ($results as &$event) {
                $event['daily_schedules'] = $schedulesByEvent[$event['id']] ?? [];
                $event['organizations'] = $orgsByEvent[$event['id']] ?? [];
            }
            unset($event);

            return $results;
        } catch (PDOException $e) {
            error_log("Error reading public registered events: " . $e->getMessage());
            return false;
        }
    }

    public function getUpcomingEvents() {
        if (!$this->conn) {
            error_log("Database connection is null");
            return false;
        }

        $currentDate = date('Y-m-d');

        $query = "SELECT e.id, e.title, e.description, e.event_day_start, e.event_day_end, e.venue, e.event_category, e.updated_at, e.created_at
                  FROM " . $this->table_name . " e
                  WHERE e.event_day_start >= :current_date
                  ORDER BY e.event_day_start ASC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':current_date', $currentDate);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return $results;
        } catch(PDOException $e) {
            error_log("Error reading upcoming events: " . $e->getMessage());
            return false;
        }
    }
}
