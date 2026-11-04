<?php

require_once __DIR__ . '/../../model/Students/AttendanceModel.php';
require_once __DIR__ . '/../../config/jwt.php';

class StudentAttendanceController {
    private $attendanceModel;

    public function __construct() {
        $this->attendanceModel = new StudentAttendanceModel();
    }

    private function getBearerToken() {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        if (!empty($headers)) {
            foreach ($headers as $key => $value) {
                if (strtolower($key) === 'authorization') {
                    $token = trim(str_ireplace('Bearer ', '', $value));
                    if (!empty($token) && $token !== 'null' && $token !== 'undefined') {
                        return $token;
                    }
                }
            }
        }
        
        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            $token = trim(str_ireplace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION']));
            if (!empty($token) && $token !== 'null' && $token !== 'undefined') {
                return $token;
            }
        }
        
        if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $token = trim(str_ireplace('Bearer ', '', $_SERVER['REDIRECT_HTTP_AUTHORIZATION']));
            if (!empty($token) && $token !== 'null' && $token !== 'undefined') {
                return $token;
            }
        }
        
        return null;
    }

    private function getStudentIdFromToken() {
        $token = $this->getBearerToken();
        if (!$token || !JWT::validate($token)) {
            return null;
        }

        $payload = JWT::decode($token);
        return isset($payload['user_id']) ? $payload['user_id'] : null;
    }

    public function getEvents() {
        header('Content-Type: application/json');
        
        $student_id = $this->getStudentIdFromToken();
        if (!$student_id) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $events = $this->attendanceModel->getEventsForStudent($student_id);

        if ($events !== false) {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'events' => $events
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to fetch events'
            ]);
        }
    }

    public function getAttendanceByEvent($event_id) {
        header('Content-Type: application/json');
        
        $student_id = $this->getStudentIdFromToken();
        if (!$student_id) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $records = $this->attendanceModel->getAttendanceForStudentAndEvent($student_id, $event_id);

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'attendance' => $records !== false ? $records : []
        ]);
    }

    public function logTime() {
        header('Content-Type: application/json');
        
        $student_id = $this->getStudentIdFromToken();
        if (!$student_id) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $rawInput = file_get_contents('php://input');
        $data = json_decode($rawInput, true);

        if (!$data || empty($data['event_id']) || empty($data['schedule_date']) || empty($data['log_type'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing required fields: event_id, schedule_date, log_type']);
            return;
        }

        $eventId = (int)$data['event_id'];
        $scheduleDate = $data['schedule_date'];
        $logType = $data['log_type'];
        $timeValue = isset($data['time_value']) ? $data['time_value'] : null;

        $today = date('Y-m-d');
        if ($scheduleDate !== $today) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Attendance can only be logged on the day of the event (' . $today . ')'
            ]);
            return;
        }
        $orgId = isset($data['organization_id']) ? (int)$data['organization_id'] : 0;
        $adviserId = isset($data['adviser_id']) ? (int)$data['adviser_id'] : 0;

        if (!$orgId || !$adviserId) {
            $events = $this->attendanceModel->getEventsForStudent($student_id);
            if ($events) {
                foreach ($events as $ev) {
                    if ((int)$ev['id'] === $eventId) {
                        if (!$orgId && !empty($ev['organization_id'])) $orgId = (int)$ev['organization_id'];
                        if (!$adviserId && !empty($ev['adviser_id'])) $adviserId = (int)$ev['adviser_id'];
                        break;
                    }
                }
            }
        }

        if (!$adviserId) $adviserId = 1;

        $record = $this->attendanceModel->logTime($student_id, $eventId, $orgId, $adviserId, $scheduleDate, $logType, $timeValue);

        if ($record !== false) {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Attendance recorded successfully',
                'data' => $record
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to record attendance'
            ]);
        }
    }

    public function submitExcuse() {
        header('Content-Type: application/json');
        
        $student_id = $this->getStudentIdFromToken();
        if (!$student_id) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $rawInput = file_get_contents('php://input');
        $data = json_decode($rawInput, true);

        if (!$data || empty($data['event_id']) || empty($data['schedule_date']) || empty($data['reason'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing event_id, schedule_date, or reason']);
            return;
        }

        $eventId = (int)$data['event_id'];
        $scheduleDate = $data['schedule_date'];
        $reason = trim($data['reason']);
        $session = isset($data['session']) ? $data['session'] : 'BOTH';
        $orgId = isset($data['organization_id']) ? (int)$data['organization_id'] : 0;
        $adviserId = isset($data['adviser_id']) ? (int)$data['adviser_id'] : 0;

        if (!$orgId || !$adviserId) {
            $events = $this->attendanceModel->getEventsForStudent($student_id);
            if ($events) {
                foreach ($events as $ev) {
                    if ((int)$ev['id'] === $eventId) {
                        if (!$orgId && !empty($ev['organization_id'])) $orgId = (int)$ev['organization_id'];
                        if (!$adviserId && !empty($ev['adviser_id'])) $adviserId = (int)$ev['adviser_id'];
                        break;
                    }
                }
            }
        }

        if (!$adviserId) $adviserId = 1;

        $record = $this->attendanceModel->submitExcuse($student_id, $eventId, $orgId, $adviserId, $scheduleDate, $reason, $session);

        if ($record !== false) {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Excuse request submitted. Pending adviser approval.',
                'data' => $record
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to submit excuse request'
            ]);
        }
    }
}
