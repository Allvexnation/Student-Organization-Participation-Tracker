<?php

require_once __DIR__ . '/../controller/SessionController.php';

class SessionRoutes {
    private $controller;

    public function __construct() {
        $this->controller = new SessionController();
    }

    public function handle($method, $uri) {
        $uri = rtrim($uri, '/');
        
        if ($method === 'GET' && $uri === '/api/session/validate') {
            $this->controller->validate();
        } elseif ($method === 'POST' && $uri === '/api/session/logout') {
            $this->controller->logout();
        } elseif ($method === 'POST' && $uri === '/api/session/logout-all') {
            $this->controller->logoutAll();
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Route not found']);
        }
    }
}
