<?php

require_once __DIR__ . '/../../controller/web/BannedController.php';

class BannedRoutes {
    private $controller;

    public function __construct() {
        $this->controller = new BannedController();
    }

    public function handle($method, $uri) {
        $uri = rtrim($uri, '/');
        
        if ($method === 'POST' && $uri === '/api/web/ban') {
            $this->controller->createBan();
        } elseif (($method === 'PUT' || $method === 'POST') && preg_match('#^/api/web/ban/(?:update/)?(\d+)$#', $uri, $matches)) {
            $this->controller->updateBan($matches[1]);
        } elseif ($method === 'POST' && $uri === '/api/web/ban/check') {
            $this->controller->checkBan();
        } elseif ($method === 'POST' && $uri === '/api/web/ban/check-overall') {
            $this->controller->checkOverallBan();
        } elseif ($method === 'POST' && $uri === '/api/web/ban/info') {
            $this->controller->getBanInfo();
        } elseif ($method === 'GET' && $uri === '/api/web/ban/sessions') {
            $this->controller->getSessions();
        } elseif ($method === 'GET' && $uri === '/api/web/ban/all') {
            $this->controller->getAllBans();
        } elseif (($method === 'POST' || $method === 'GET') && $uri === '/api/web/ban/cleanup') {
            $this->controller->cleanupExpiredBans();
        } elseif ($method === 'POST' && preg_match('#^/api/web/ban/deactivate/(\d+)$#', $uri, $matches)) {
            $this->controller->deactivateBan($matches[1]);
        } elseif ($method === 'POST' && preg_match('#^/api/web/ban/activate/(\d+)$#', $uri, $matches)) {
            $this->controller->activateBan($matches[1]);
        } elseif ($method === 'DELETE' && preg_match('#^/api/web/ban/delete/(\d+)$#', $uri, $matches)) {
            $this->controller->deleteBan($matches[1]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Route not found']);
        }
    }
}
