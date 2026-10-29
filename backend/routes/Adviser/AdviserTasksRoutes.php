<?php

require_once __DIR__ . '/../../controller/Adviser/AdviserEventsController.php';

class AdviserTasksRoutes {
    private $controller;

    public function __construct() {
        $this->controller = new AdviserEventsController();
    }

    public function handle($method, $uri) {
        $uri = rtrim($uri, '/');

        if ($method === 'GET' && $uri === '/api/adviser/registered-events') {
            $this->controller->getRegisteredEvents();
        } elseif ($method === 'GET' && preg_match('#^/api/adviser/organizations-by-event/(\d+)$#', $uri, $matches)) {
            $this->controller->getOrganizationsByEvent($matches[1]);
        }
        
        elseif ($method === 'GET' && $uri === '/api/adviser/tasks') {
            $this->controller->getAllTasks();
        } elseif ($method === 'GET' && preg_match('#^/api/adviser/tasks/event/(\d+)$#', $uri, $matches)) {
            $this->controller->getTasksByEvent($matches[1]);
        } elseif ($method === 'GET' && preg_match('#^/api/adviser/tasks/organization/(\d+)$#', $uri, $matches)) {
            $this->controller->getTasksByOrganization($matches[1]);
        } elseif ($method === 'GET' && preg_match('#^/api/adviser/tasks/(\d+)$#', $uri, $matches)) {
            $this->controller->getTask($matches[1]);
        } elseif ($method === 'POST' && $uri === '/api/adviser/tasks/group') {
            $this->controller->syncTaskGroup();
        } elseif ($method === 'PUT' && $uri === '/api/adviser/tasks/group') {
            $this->controller->syncTaskGroup();
        } elseif ($method === 'DELETE' && $uri === '/api/adviser/tasks/group') {
            $this->controller->deleteTaskGroup();
        } elseif ($method === 'POST' && $uri === '/api/adviser/tasks') {
            $this->controller->createTask();
        } elseif ($method === 'PUT' && preg_match('#^/api/adviser/tasks/(\d+)$#', $uri, $matches)) {
            $this->controller->updateTask($matches[1]);
        } elseif ($method === 'PATCH' && preg_match('#^/api/adviser/tasks/(\d+)/status$#', $uri, $matches)) {
            $this->controller->updateTaskStatus($matches[1]);
        } elseif ($method === 'DELETE' && preg_match('#^/api/adviser/tasks/(\d+)$#', $uri, $matches)) {
            $this->controller->deleteTask($matches[1]);
        } elseif ($method === 'PATCH' && preg_match('#^/api/adviser/schedule-status/(\d+)$#', $uri, $matches)) {
            $this->controller->updateScheduleStatus($matches[1]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Route not found']);
        }
    }
}
