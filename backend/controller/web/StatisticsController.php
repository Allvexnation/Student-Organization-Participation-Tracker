<?php

require_once __DIR__ . '/../../config/db.php';

class StatisticsController {
    private $db;

    public function __construct() {
        $database = Database::getInstance();
        $this->db = $database->getConnection();
    }

    public function getPublicStatistics() {
        try {

            $stmt = $this->db->prepare("SELECT COUNT(*) as count FROM students");
            $stmt->execute();
            $totalStudents = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

            $stmt = $this->db->prepare("SELECT COUNT(*) as count FROM organizations");
            $stmt->execute();
            $totalOrganizations = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

            $stmt = $this->db->prepare("SELECT COUNT(*) as count FROM events");
            $stmt->execute();
            $totalEvents = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

            $stmt = $this->db->prepare("SELECT COUNT(*) as count FROM member_tasks");
            $stmt->execute();
            $totalTasks = $stmt->fetch(PDO::FETCH_ASSOC)['count'];

            header('Content-Type: application/json');
            echo json_encode([
                'total_students' => (int)$totalStudents,
                'total_organizations' => (int)$totalOrganizations,
                'total_events' => (int)$totalEvents,
                'total_tasks' => (int)$totalTasks
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }
}
