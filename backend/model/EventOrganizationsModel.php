<?php

require_once __DIR__ . '/../config/db.php';

class EventOrganizationsModel {
    private $conn;
    private $table_name = "event_organizations";

    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
        if (!$this->conn) {
            error_log("Failed to establish database connection in EventOrganizationsModel");
        }
    }

    public function create($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (event_id, organization_id, approver_id, registered_at, status) 
                  VALUES (:event_id, :organization_id, :approver_id, :registered_at, :status)";

        try {
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':event_id', $data['event_id']);
            $stmt->bindParam(':organization_id', $data['organization_id']);
            $stmt->bindParam(':approver_id', $data['approver_id']);
            $stmt->bindParam(':registered_at', $data['registered_at']);
            $stmt->bindParam(':status', $data['status']);
            
            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error creating event organization: " . $e->getMessage());
            error_log("Data: " . json_encode($data));
            if (strpos($e->getMessage(), 'Duplicate entry') !== false || strpos($e->getMessage(), 'unique_event_organization') !== false) {
                echo "Error: This organization is already registered for this event";
            } else {
                echo "Error creating event organization: " . $e->getMessage();
            }
            return false;
        }
    }

    public function readAll() {
        if (!$this->conn) {
            error_log("Database connection is null");
            return false;
        }

        $query = "SELECT eo.id, eo.event_id, eo.organization_id, eo.approver_id, eo.registered_at, eo.status, eo.created_at,
                         e.title as event_title, o.name as organization_name,
                         COALESCE(a.name, adm.name) as approver_name,
                         COALESCE(a.username, adm.username) as approver_username,
                         CASE
                             WHEN a.id IS NOT NULL THEN 'adviser'
                             WHEN adm.id IS NOT NULL THEN 'admin'
                             ELSE NULL
                         END as approver_type
                  FROM " . $this->table_name . " eo
                  LEFT JOIN events e ON eo.event_id = e.id
                  LEFT JOIN organizations o ON eo.organization_id = o.id
                  LEFT JOIN advisers a ON eo.approver_id = a.id
                  LEFT JOIN admins adm ON eo.approver_id = adm.id
                  ORDER BY eo.created_at DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            error_log("Event organizations fetched: " . count($results));
            return $results;
        } catch(PDOException $e) {
            error_log("Error reading event organizations: " . $e->getMessage());
            return false;
        }
    }

    public function readOne($id) {
        $query = "SELECT eo.id, eo.event_id, eo.organization_id, eo.approver_id, eo.registered_at, eo.status, eo.created_at,
                         e.title as event_title, o.name as organization_name,
                         COALESCE(a.name, adm.name) as approver_name,
                         COALESCE(a.username, adm.username) as approver_username,
                         CASE 
                             WHEN a.id IS NOT NULL THEN 'adviser'
                             WHEN adm.id IS NOT NULL THEN 'admin'
                             ELSE NULL
                         END as approver_type
                  FROM " . $this->table_name . " eo
                  LEFT JOIN events e ON eo.event_id = e.id
                  LEFT JOIN organizations o ON eo.organization_id = o.id
                  LEFT JOIN advisers a ON eo.approver_id = a.id
                  LEFT JOIN admins adm ON eo.approver_id = adm.id
                  WHERE eo.id = :id
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            return $result;
        } catch(PDOException $e) {
            echo "Error reading event organization: " . $e->getMessage();
            return false;
        }
    }

    public function update($id, $data) {
        $query = "UPDATE " . $this->table_name . " 
                  SET event_id = :event_id, 
                      organization_id = :organization_id,
                      approver_id = :approver_id,
                      status = :status
                  WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':event_id', $data['event_id']);
            $stmt->bindParam(':organization_id', $data['organization_id']);
            $stmt->bindParam(':approver_id', $data['approver_id']);
            $stmt->bindParam(':status', $data['status']);
            $stmt->bindParam(':id', $id);
            
            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            echo "Error updating event organization: " . $e->getMessage();
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
            echo "Error deleting event organization: " . $e->getMessage();
            return false;
        }
    }

    public function deleteByEventId($event_id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE event_id = :event_id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':event_id', $event_id);
            return $stmt->execute();
        } catch(PDOException $e) {
            error_log("Error deleting event organization by event: " . $e->getMessage());
            return false;
        }
    }

    public function syncEventOrganizations($event_id, $organization_ids, $approver_id) {
        try {
            $this->conn->beginTransaction();

            $orgIds = array_map('intval', (array)$organization_ids);

            if (empty($orgIds)) {
                $delQuery = "DELETE FROM " . $this->table_name . " WHERE event_id = :event_id";
                $delStmt = $this->conn->prepare($delQuery);
                $delStmt->bindParam(':event_id', $event_id);
                $delStmt->execute();
            } else {
                $placeholders = implode(',', array_fill(0, count($orgIds), '?'));
                $delQuery = "DELETE FROM " . $this->table_name . " WHERE event_id = ? AND organization_id NOT IN ($placeholders)";
                $delStmt = $this->conn->prepare($delQuery);
                $params = array_merge([$event_id], $orgIds);
                $delStmt->execute($params);

                foreach ($orgIds as $orgId) {
                    $checkQuery = "SELECT id FROM " . $this->table_name . " WHERE event_id = :event_id AND organization_id = :org_id LIMIT 1";
                    $checkStmt = $this->conn->prepare($checkQuery);
                    $checkStmt->bindParam(':event_id', $event_id);
                    $checkStmt->bindParam(':org_id', $orgId);
                    $checkStmt->execute();
                    $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

                    if ($existing) {
                        $upQuery = "UPDATE " . $this->table_name . " SET approver_id = :approver_id WHERE id = :id";
                        $upStmt = $this->conn->prepare($upQuery);
                        $upStmt->bindParam(':approver_id', $approver_id);
                        $upStmt->bindParam(':id', $existing['id']);
                        $upStmt->execute();
                    } else {
                        $inQuery = "INSERT INTO " . $this->table_name . " (event_id, organization_id, approver_id, registered_at, status) VALUES (:event_id, :org_id, :approver_id, NOW(), 'registered')";
                        $inStmt = $this->conn->prepare($inQuery);
                        $inStmt->bindParam(':event_id', $event_id);
                        $inStmt->bindParam(':org_id', $orgId);
                        $inStmt->bindParam(':approver_id', $approver_id);
                        $inStmt->execute();
                    }
                }
            }

            $this->conn->commit();
            return true;
        } catch(PDOException $e) {
            $this->conn->rollBack();
            error_log("Error syncing event organizations: " . $e->getMessage());
            return false;
        }
    }

    public function getApproverByOrganization($organization_id) {
        $query = "SELECT a.id, a.name, a.username, a.email
                  FROM organizations o
                  LEFT JOIN advisers a ON o.adviser_id = a.id
                  WHERE o.id = :organization_id
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':organization_id', $organization_id);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $result;
        } catch(PDOException $e) {
            echo "Error getting approver: " . $e->getMessage();
            return false;
        }
    }

    public function checkExisting($event_id, $organization_id) {
        $query = "SELECT id FROM " . $this->table_name . " 
                  WHERE event_id = :event_id AND organization_id = :organization_id
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':event_id', $event_id);
            $stmt->bindParam(':organization_id', $organization_id);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $result;
        } catch(PDOException $e) {
            echo "Error checking existing: " . $e->getMessage();
            return false;
        }
    }

    public function getAllApprovers() {
        $query = "SELECT id, name, username, email, 'admin' as type
                  FROM admins
                  UNION ALL
                  SELECT id, name, username, email, 'adviser' as type
                  FROM advisers
                  ORDER BY type, name";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return $results;
        } catch(PDOException $e) {
            echo "Error getting approvers: " . $e->getMessage();
            return false;
        }
    }

    public function getRegisteredEventsByAdviserId($adviser_id, $organization_id = null) {
        $query = "SELECT eo.id as event_org_id, e.id, e.id as event_id, e.title, e.title as event_title, 
                         e.description, e.venue, e.event_day_start, e.event_day_end, e.event_category,
                         o.id as organization_id, o.name as organization_name
                  FROM events e
                  INNER JOIN " . $this->table_name . " eo ON eo.event_id = e.id
                  INNER JOIN organizations o ON eo.organization_id = o.id
                  LEFT JOIN advisers a ON a.id = :adviser_id_1
                  WHERE (o.adviser_id = :adviser_id_2 OR o.id = a.current_organization_id OR eo.approver_id = :adviser_id_3)";

        if ($organization_id) {
            $query .= " AND eo.organization_id = :organization_id";
        }

        $query .= " ORDER BY e.event_day_start DESC, o.name ASC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindValue(':adviser_id_1', $adviser_id);
            $stmt->bindValue(':adviser_id_2', $adviser_id);
            $stmt->bindValue(':adviser_id_3', $adviser_id);
            if ($organization_id) {
                $stmt->bindValue(':organization_id', $organization_id);
            }
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

            if (empty($results)) {
                return $results;
            }

            $eventIds = array_values(array_unique(array_filter(array_map(function ($event) {
                return (int)($event['event_id'] ?? $event['id'] ?? 0);
            }, $results))));

            $schedulesByEvent = [];
            if (!empty($eventIds)) {
                $placeholders = implode(',', array_fill(0, count($eventIds), '?'));
                $schedQuery = "SELECT id, event_id, schedule_date, start_time, end_time
                               FROM event_daily_schedules
                               WHERE event_id IN ($placeholders)
                               ORDER BY schedule_date ASC";
                $schedStmt = $this->conn->prepare($schedQuery);
                $schedStmt->execute($eventIds);
                foreach ($schedStmt->fetchAll(PDO::FETCH_ASSOC) as $schedule) {
                    $schedulesByEvent[(int)$schedule['event_id']][] = [
                        'id' => $schedule['id'],
                        'schedule_date' => $schedule['schedule_date'],
                        'start_time' => $schedule['start_time'],
                        'end_time' => $schedule['end_time']
                    ];
                }
            }

            foreach ($results as &$event) {
                $eventId = (int)($event['event_id'] ?? $event['id'] ?? 0);
                $schedules = $schedulesByEvent[$eventId] ?? [];

                if (empty($schedules) && !empty($event['event_day_start']) && !empty($event['event_day_end'])) {
                    try {
                        $start = new DateTime($event['event_day_start']);
                        $end = new DateTime($event['event_day_end']);
                        $end->modify('+1 day');
                        $period = new DatePeriod($start, new DateInterval('P1D'), $end);

                        foreach ($period as $dt) {
                            $schedules[] = [
                                'schedule_date' => $dt->format('Y-m-d'),
                                'start_time' => '08:00:00',
                                'end_time' => '17:00:00'
                            ];
                        }
                    } catch (Exception $e) {
                    }
                }

                $event['daily_schedules'] = $schedules;
            }
            unset($event);

            return $results;
        } catch(PDOException $e) {
            error_log("Error getting registered events by adviser: " . $e->getMessage());
            return false;
        }
    }

    public function getOrganizationsByEventId($event_id, $adviser_id) {
        $query = "SELECT eo.id as event_org_id, eo.organization_id, eo.event_id,
                         o.name as organization_name
                  FROM " . $this->table_name . " eo
                  LEFT JOIN organizations o ON eo.organization_id = o.id
                  LEFT JOIN advisers a ON a.id = :adviser_id
                  WHERE eo.event_id = :event_id AND (o.adviser_id = :adviser_id OR o.id = a.current_organization_id OR eo.approver_id = :adviser_id)
                  ORDER BY o.name";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':event_id', $event_id);
            $stmt->bindParam(':adviser_id', $adviser_id);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return $results;
        } catch(PDOException $e) {
            error_log("Error getting organizations by event: " . $e->getMessage());
            return false;
        }
    }
}
