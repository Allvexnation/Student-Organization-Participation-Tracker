<?php

require_once __DIR__ . '/../controller/HelloController.php';

class HelloRoutes {
    private $controller;

    public function __construct() {
        $this->controller = new HelloController();
    }

    public function handle($method, $uri) {
        $uri = rtrim($uri, '/');

        if ($method === 'GET' && $uri === '/api/hello') {
            $this->controller->index();
        } elseif ($method === 'POST' && $uri === '/api/hello') {
            $this->controller->store();
        } elseif ($method === 'GET' && preg_match('#^/api/hello/(\d+)$#', $uri, $matches)) {
            $this->controller->show($matches[1]);
        } elseif ($method === 'PUT' && preg_match('#^/api/hello/(\d+)$#', $uri, $matches)) {
            $this->controller->update($matches[1]);
        } elseif ($method === 'DELETE' && preg_match('#^/api/hello/(\d+)$#', $uri, $matches)) {
            $this->controller->destroy($matches[1]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Route not found']);
        }
    }
}
