<?php

require_once __DIR__ . '/../../model/Adviser/AttendanceModel.php';
require_once __DIR__ . '/../../config/jwt.php';

class AttendanceController {
    private $attendanceModel;

    public function __construct() {
        $this->attendanceModel = new AttendanceModel();
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

    private function getAdviserIdFromToken() {
        $token = $this->getBearerToken();
        
        if (!$token || !JWT::validate($token)) {
            return null;
        }

        $payload = JWT::decode($token);
        return isset($payload['user_id']) ? $payload['user_id'] : null;
    }

    public function getRegisteredEvents() {
        header('Content-Type: application/json');
        
        $adviser_id = $this->getAdviserIdFromToken();
        if (!$adviser_id) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $events = $this->attendanceModel->getRegisteredEventsForAdviser($adviser_id);

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
        
        $adviser_id = $this->getAdviserIdFromToken();
        if (!$adviser_id) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $event = $this->attendanceModel->getEventForAdviser($event_id, $adviser_id);
        if (!$event) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Event not found or not associated with your organization'
            ]);
            return;
        }

        $scheduleDate = isset($_GET['date']) ? trim($_GET['date']) : null;

        $students = $this->attendanceModel->getStudentsForEvent($event_id, $adviser_id);
        $attendance = $this->attendanceModel->getAttendanceByEvent($event_id, $scheduleDate);

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'event' => $event,
            'students' => $students !== false ? $students : [],
            'attendance' => $attendance !== false ? $attendance : []
        ]);
    }

    public function logTime() {
        header('Content-Type: application/json');
        
        $adviser_id = $this->getAdviserIdFromToken();
        if (!$adviser_id) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $rawInput = file_get_contents('php://input');
        $data = json_decode($rawInput, true);

        if (!$data || empty($data['student_id']) || empty($data['event_id']) || empty($data['schedule_date']) || empty($data['log_type'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing required fields: student_id, event_id, schedule_date, log_type']);
            return;
        }

        $studentId = (int)$data['student_id'];
        $eventId = (int)$data['event_id'];
        $scheduleDate = $data['schedule_date'];
        $logType = $data['log_type'];
        $timeValue = isset($data['time_value']) ? $data['time_value'] : null;

        $today = date('Y-m-d');
        if ($scheduleDate !== $today) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Live session logging is only enabled on the day of the event (' . $today . '). Please use Edit Session to update records for other dates.'
            ]);
            return;
        }
        $orgId = isset($data['organization_id']) ? (int)$data['organization_id'] : 0;

        if (!$orgId) {
            $event = $this->attendanceModel->getEventForAdviser($eventId, $adviser_id);
            if ($event && !empty($event['organization_id'])) {
                $orgId = (int)$event['organization_id'];
            }
        }

        if (!$orgId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Organization ID could not be identified']);
            return;
        }

        $record = $this->attendanceModel->logTime($studentId, $adviser_id, $eventId, $orgId, $scheduleDate, $logType, $timeValue);

        if ($record !== false) {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Attendance logged successfully',
                'data' => $record
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to log attendance'
            ]);
        }
    }

    public function editSession() {
        header('Content-Type: application/json');
        
        $adviser_id = $this->getAdviserIdFromToken();
        if (!$adviser_id) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $rawInput = file_get_contents('php://input');
        $data = json_decode($rawInput, true);

        if (!$data || empty($data['student_id']) || empty($data['event_id']) || empty($data['schedule_date'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing required fields: student_id, event_id, schedule_date']);
            return;
        }

        $studentId = (int)$data['student_id'];
        $eventId = (int)$data['event_id'];
        $scheduleDate = $data['schedule_date'];
        $orgId = isset($data['organization_id']) ? (int)$data['organization_id'] : 0;

        if (!$orgId) {
            $event = $this->attendanceModel->getEventForAdviser($eventId, $adviser_id);
            if ($event && !empty($event['organization_id'])) {
                $orgId = (int)$event['organization_id'];
            }
        }

        $record = $this->attendanceModel->editStudentSession($studentId, $adviser_id, $eventId, $orgId, $scheduleDate, $data);

        if ($record !== false) {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Session updated successfully',
                'data' => $record
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update session'
            ]);
        }
    }

    public function handleExcuseApproval() {
        header('Content-Type: application/json');
        
        $adviser_id = $this->getAdviserIdFromToken();
        if (!$adviser_id) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $rawInput = file_get_contents('php://input');
        $data = json_decode($rawInput, true);

        $action = !empty($data['action']) ? strtolower(trim($data['action'])) : ''; // 'approve' or 'reject'
        $attendanceId = !empty($data['attendance_id']) ? (int)$data['attendance_id'] : (!empty($data['id']) ? (int)$data['id'] : null);
        $studentId = !empty($data['student_id']) ? (int)$data['student_id'] : null;
        $eventId = !empty($data['event_id']) ? (int)$data['event_id'] : null;
        $scheduleDate = !empty($data['schedule_date']) ? $data['schedule_date'] : null;

        if (!$action || (!$attendanceId && (!$studentId || !$eventId || !$scheduleDate))) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing required fields: action and attendance identifier']);
            return;
        }

        $record = $this->attendanceModel->handleExcuseApproval($studentId, $adviser_id, $eventId, $scheduleDate, $action, $attendanceId);

        if ($record !== false) {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => $action === 'approve' ? 'Excuse approved successfully' : 'Excuse rejected',
                'data' => $record
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to process excuse approval'
            ]);
        }
    }

    public function markAbsent() {
        header('Content-Type: application/json');
        
        $adviser_id = $this->getAdviserIdFromToken();
        if (!$adviser_id) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $rawInput = file_get_contents('php://input');
        $data = json_decode($rawInput, true);

        if (!$data || empty($data['student_id']) || empty($data['event_id']) || empty($data['schedule_date'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing required fields: student_id, event_id, schedule_date']);
            return;
        }

        $studentId = (int)$data['student_id'];
        $eventId = (int)$data['event_id'];
        $scheduleDate = $data['schedule_date'];
        $session = isset($data['session']) ? $data['session'] : 'BOTH';
        $orgId = isset($data['organization_id']) ? (int)$data['organization_id'] : 0;

        if (!$orgId) {
            $event = $this->attendanceModel->getEventForAdviser($eventId, $adviser_id);
            if ($event && !empty($event['organization_id'])) {
                $orgId = (int)$event['organization_id'];
            }
        }

        if (!$orgId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Organization ID could not be identified']);
            return;
        }

        $record = $this->attendanceModel->markAbsent($studentId, $adviser_id, $eventId, $orgId, $scheduleDate, $session);

        if ($record !== false) {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => "Student marked as Absent ({$session})",
                'data' => $record
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to mark student absent'
            ]);
        }
    }

    public function markExcused() {
        header('Content-Type: application/json');
        
        $adviser_id = $this->getAdviserIdFromToken();
        if (!$adviser_id) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $rawInput = file_get_contents('php://input');
        $data = json_decode($rawInput, true);

        if (!$data || empty($data['student_id']) || empty($data['event_id']) || empty($data['schedule_date']) || empty($data['reason'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing required fields: student_id, event_id, schedule_date, reason']);
            return;
        }

        $studentId = (int)$data['student_id'];
        $eventId = (int)$data['event_id'];
        $scheduleDate = $data['schedule_date'];
        $reason = trim($data['reason']);
        $session = isset($data['session']) ? $data['session'] : 'BOTH';
        $orgId = isset($data['organization_id']) ? (int)$data['organization_id'] : 0;

        if (!$orgId) {
            $event = $this->attendanceModel->getEventForAdviser($eventId, $adviser_id);
            if ($event && !empty($event['organization_id'])) {
                $orgId = (int)$event['organization_id'];
            }
        }

        if (!$orgId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Organization ID could not be identified']);
            return;
        }

        $record = $this->attendanceModel->markExcused($studentId, $adviser_id, $eventId, $orgId, $scheduleDate, $reason, $session);

        if ($record !== false) {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Student marked as Excused',
                'data' => $record
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to mark student excused'
            ]);
        }
    }

    public function resetAttendance() {
        header('Content-Type: application/json');
        
        $adviser_id = $this->getAdviserIdFromToken();
        if (!$adviser_id) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $rawInput = file_get_contents('php://input');
        $data = json_decode($rawInput, true);

        if (!$data || empty($data['student_id']) || empty($data['event_id']) || empty($data['schedule_date'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing student_id, event_id, or schedule_date']);
            return;
        }

        $studentId = (int)$data['student_id'];
        $eventId = (int)$data['event_id'];
        $scheduleDate = $data['schedule_date'];

        $res = $this->attendanceModel->resetStudentDayAttendance($studentId, $eventId, $scheduleDate);

        if ($res !== false) {
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Student attendance reset successfully'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to reset student attendance'
            ]);
        }
    }
}
