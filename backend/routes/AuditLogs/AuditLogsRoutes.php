<?php

require_once __DIR__ . '/../../controller/AuditLogs/AuditLogsController.php';

class AuditLogsRoutes {
    private $controller;

    public function __construct() {
        $this->controller = new AuditLogsController();
    }

    public function handle($method, $uri) {
        header('Content-Type: application/json');
        $uri = rtrim($uri, '/');

        if ($method === 'POST' && $uri === '/api/audit-logs/log') {
            echo json_encode($this->controller->logChange(json_decode(file_get_contents('php://input'), true)));
        }

        elseif ($method === 'GET' && $uri === '/api/audit-logs') {
            try {
                echo json_encode($this->controller->getAllLogs());
            } catch (Exception $e) {
                error_log("Route error: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
            }
        }

        elseif ($method === 'GET' && preg_match('#^/api/audit-logs/(\d+)$#', $uri, $matches)) {
            echo json_encode($this->controller->getLogById($matches[1]));
        }

        elseif ($method === 'GET' && preg_match('#^/api/audit-logs/user/(\d+)/(\w+)$#', $uri, $matches)) {
            echo json_encode($this->controller->getLogsByUser($matches[1], $matches[2]));
        }

        elseif ($method === 'GET' && preg_match('#^/api/audit-logs/record/(\w+)/(\d+)$#', $uri, $matches)) {
            echo json_encode($this->controller->getLogsByRecord($matches[1], $matches[2]));
        }

        elseif ($method === 'DELETE' && preg_match('#^/api/audit-logs/(\d+)$#', $uri, $matches)) {
            echo json_encode($this->controller->deleteLog($matches[1]));
        }
 
        elseif ($method === 'DELETE' && $uri === '/api/audit-logs/cleanup') {
            echo json_encode($this->controller->deleteOldLogs());
        }
        else {
            http_response_code(404);
            echo json_encode(['message' => 'Route not found']);
        }
    }
}
