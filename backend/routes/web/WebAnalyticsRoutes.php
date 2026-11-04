<?php

require_once __DIR__ . '/../../controller/web/WebAnalyticsController.php';

class WebAnalyticsRoutes {
    private $controller;

    public function __construct() {
        $this->controller = new WebAnalyticsController();
    }

    public function handle($method, $uri) {
        $uri = rtrim($uri, '/');

        $id = null;
        if (preg_match('#^/api/web/analytics/(\d+)$#', $uri, $matches)) {
            $id = $matches[1];
        }

        if ($method === 'GET' && $uri === '/api/web/analytics') {
            $this->controller->getAll();
        } elseif ($method === 'GET' && $uri === '/api/web/analytics/stats') {
            $this->controller->getStats();
        } elseif ($method === 'GET' && $uri === '/api/web/analytics/active-sessions') {
            $this->controller->getActiveSessions();
        } elseif ($method === 'GET' && preg_match('#^/api/web/analytics/route/(.+)$#', $uri, $matches)) {
            $route = urldecode($matches[1]);
            $this->controller->getByRoute($route);
        } elseif ($method === 'GET' && preg_match('#^/api/web/analytics/date/([^/]+)/([^/]+)$#', $uri, $matches)) {
            $startDate = $matches[1];
            $endDate = $matches[2];
            $this->controller->getByDate($startDate, $endDate);
        } elseif ($method === 'GET' && $id !== null) {
            $this->controller->getOne($id);
        } elseif ($method === 'POST' && $uri === '/api/web/analytics/track') {
            $this->controller->track();
        } elseif ($method === 'POST' && $uri === '/api/web/analytics/update-active') {
            $this->controller->updateActive();
        } elseif ($method === 'POST' && $uri === '/api/web/analytics/update-url') {
            $this->controller->updateUrl();
        } elseif ($method === 'DELETE' && $id !== null) {
            $this->controller->delete($id);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Route not found']);
        }
    }
}
