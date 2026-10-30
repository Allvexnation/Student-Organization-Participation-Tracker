<?php

require_once __DIR__ . '/../controller/AdminController.php';

class AdminRoutes {
    private $controller;

    public function __construct() {
        $this->controller = new AdminController();
    }

    public function handle($method, $uri) {
        $uri = rtrim($uri, '/');
        
        if ($method === 'POST' && $uri === '/api/admin/login') {
            $this->controller->login();
        } elseif ($method === 'POST' && $uri === '/api/admin/logout') {
            $this->controller->logout();
        } elseif ($method === 'GET' && $uri === '/api/admin/profile') {
            $this->controller->getProfile();
        } elseif ($method === 'PUT' && $uri === '/api/admin/profile') {
            $this->controller->updateProfile();
        } elseif ($method === 'GET' && $uri === '/api/admin/dashboard/counts') {
            $this->controller->getDashboardCounts();
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Route not found']);
        }
    }
}
