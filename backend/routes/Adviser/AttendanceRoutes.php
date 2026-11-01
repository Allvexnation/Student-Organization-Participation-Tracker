<?php

require_once __DIR__ . '/../../controller/Adviser/AttendanceController.php';

class AttendanceRoutes {
    private $controller;

    public function __construct() {
        $this->controller = new AttendanceController();
    }

    public function handle($method, $uri) {
        $uri = rtrim($uri, '/');

        if ($method === 'GET' && $uri === '/api/adviser/attendance/events') {
            $this->controller->getRegisteredEvents();
        } elseif ($method === 'GET' && preg_match('#^/api/adviser/attendance/event/(\d+)$#', $uri, $matches)) {
            $this->controller->getAttendanceByEvent($matches[1]);
        } elseif ($method === 'POST' && $uri === '/api/adviser/attendance/log') {
            $this->controller->logTime();
        } elseif ($method === 'POST' && $uri === '/api/adviser/attendance/edit-session') {
            $this->controller->editSession();
        } elseif ($method === 'POST' && $uri === '/api/adviser/attendance/approve-excuse') {
            $this->controller->handleExcuseApproval();
        } elseif ($method === 'POST' && $uri === '/api/adviser/attendance/absent') {
            $this->controller->markAbsent();
        } elseif ($method === 'POST' && $uri === '/api/adviser/attendance/excuse') {
            $this->controller->markExcused();
        } elseif ($method === 'POST' && $uri === '/api/adviser/attendance/reset') {
            $this->controller->resetAttendance();
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Attendance route not found']);
        }
    }
}
