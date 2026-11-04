<?php

require_once __DIR__ . '/../../controller/web/StatisticsController.php';

class StatisticsRoutes {
    private $controller;

    public function __construct() {
        $this->controller = new StatisticsController();
    }

    public function handle($method, $uri) {
        $uri = rtrim($uri, '/');

        if ($method === 'GET' && $uri === '/api/web/statistics') {
            $this->controller->getPublicStatistics();
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Route not found']);
        }
    }
}
