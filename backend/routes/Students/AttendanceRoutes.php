<?php

require_once __DIR__ . '/../../controller/Students/AttendanceController.php';

class StudentAttendanceRoutes {
    private $controller;

    public function __construct() {
        $this->controller = new StudentAttendanceController();
    }

    public function handle($method, $uri) {
        $uri = rtrim($uri, '/');

        if ($method === 'GET' && $uri === '/api/student/attendance/events') {
            $this->controller->getEvents();
        } elseif ($method === 'GET' && preg_match('#^/api/student/attendance/event/(\d+)$#', $uri, $matches)) {
            $this->controller->getAttendanceByEvent($matches[1]);
        } elseif ($method === 'POST' && $uri === '/api/student/attendance/log') {
            $this->controller->logTime();
        } elseif ($method === 'POST' && $uri === '/api/student/attendance/excuse') {
            $this->controller->submitExcuse();
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Student attendance route not found']);
        }
    }
}
