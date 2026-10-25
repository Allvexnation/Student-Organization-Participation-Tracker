<?php

require_once __DIR__ . '/../controller/EventRegistrationsController.php';

class EventRegistrationsRoutes {
    private $controller;

    public function __construct() {
        $this->controller = new EventRegistrationsController();
    }

    public function handle($method, $uri) {
        $uri = rtrim($uri, '/');
        
        if ($method === 'GET' && $uri === '/api/admin/event-registrations') {
            $this->controller->getAll();
        } elseif ($method === 'GET' && preg_match('#^/api/admin/event-registrations/(\d+)$#', $uri, $matches)) {
            $this->controller->getOne($matches[1]);
        } elseif ($method === 'POST' && $uri === '/api/admin/event-registrations') {
            $this->controller->create();
        } elseif ($method === 'PUT' && preg_match('#^/api/admin/event-registrations/(\d+)$#', $uri, $matches)) {
            $this->controller->update($matches[1]);
        } elseif ($method === 'DELETE' && preg_match('#^/api/admin/event-registrations/(\d+)$#', $uri, $matches)) {
            $this->controller->delete($matches[1]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Route not found']);
        }
    }
}
