<?php

require_once __DIR__ . '/../controller/OAuthController.php';

class OAuthRoutes {
    private $controller;

    public function __construct() {
        $this->controller = new OAuthController();
    }

    public function handle($method, $uri) {
        if ($method === 'POST' && $uri === '/api/oauth/google/login') {
            $this->controller->googleLogin();
        } elseif ($method === 'GET' && $uri === '/api/oauth/google/config') {
            $this->controller->getGoogleConfig();
        } elseif ($method === 'POST' && $uri === '/api/oauth/google/adviser/login') {
            $this->controller->adviserGoogleLogin();
        } elseif ($method === 'POST' && $uri === '/api/oauth/google/student/login') {
            $this->controller->studentGoogleLogin();
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Route not found']);
        }
    }
}
