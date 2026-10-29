<?php

require_once __DIR__ . '/../controller/AdviserController.php';

class AdviserAuthRoutes {
    private $controller;

    public function __construct() {
        $this->controller = new AdviserController();
    }

    public function handle($method, $uri) {
        $uri = rtrim($uri, '/');
        
        if ($method === 'POST' && $uri === '/api/adviser/login') {
            $this->controller->login();
        } elseif ($method === 'POST' && $uri === '/api/adviser/logout') {
            $this->controller->logout();
        } elseif ($method === 'POST' && $uri === '/api/adviser/forgot-password') {
            $this->controller->forgotPassword();
        } elseif ($method === 'POST' && $uri === '/api/adviser/verify-otp') {
            $this->controller->verifyOtp();
        } elseif ($method === 'POST' && $uri === '/api/adviser/reset-password') {
            $this->controller->resetPassword();
        } elseif ($method === 'GET' && $uri === '/api/adviser/verify') {
            $this->controller->verify();
        } elseif ($method === 'GET' && $uri === '/api/adviser/profile') {
            $this->controller->getProfile();
        } elseif ($method === 'PUT' && $uri === '/api/adviser/profile') {
            $this->controller->updateProfile();
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Route not found']);
        }
    }
}
