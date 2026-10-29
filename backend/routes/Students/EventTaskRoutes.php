<?php

require_once __DIR__ . '/../../controller/Students/EventTaskController.php';

class EventTaskRoutes {
    private $controller;

    public function __construct() {
        $this->controller = new EventTaskController();
    }

    public function handle($method, $uri) {
        $uri = rtrim($uri, '/');

        if ($method === 'GET' && $uri === '/api/student/tasks') {
            $this->controller->getAll();
        } elseif ($method === 'GET' && preg_match('#^/api/student/tasks/(\d+)$#', $uri, $matches)) {
            $this->controller->getOne($matches[1]);
        } elseif ($method === 'PATCH' && preg_match('#^/api/student/tasks/(\d+)/status$#', $uri, $matches)) {
            $this->controller->updateStatus($matches[1]);
        } elseif ($method === 'PATCH' && preg_match('#^/api/student/schedule-status/(\d+)$#', $uri, $matches)) {
            $this->controller->updateScheduleStatus($matches[1]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Route not found']);
        }
    }
}
