<?php

require_once __DIR__ . '/../controller/AdviserController.php';

class AdviserRoutes {
    private $controller;

    public function __construct() {
        $this->controller = new AdviserController();
    }

    public function handle($method, $uri) {
        $uri = rtrim($uri, '/');
        
        if ($method === 'GET' && $uri === '/api/admin/advisers') {
            $this->controller->getAll();
        } elseif ($method === 'GET' && preg_match('#^/api/admin/advisers/(\d+)$#', $uri, $matches)) {
            $this->controller->getOne($matches[1]);
        } elseif ($method === 'POST' && $uri === '/api/admin/advisers') {
            $this->controller->create();
        } elseif ($method === 'PUT' && preg_match('#^/api/admin/advisers/(\d+)$#', $uri, $matches)) {
            $this->controller->update($matches[1]);
        } elseif ($method === 'DELETE' && preg_match('#^/api/admin/advisers/(\d+)$#', $uri, $matches)) {
            $this->controller->delete($matches[1]);
        } elseif ($method === 'GET' && $uri === '/api/adviser/dashboard/counts') {
            $this->controller->getDashboardCounts();
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Route not found']);
        }
    }
}
