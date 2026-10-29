<?php

require_once __DIR__ . '/../../controller/Students/StudentController.php';

class StudentAuthRoutes {
    private $controller;

    public function __construct() {
        $this->controller = new StudentController();
    }

    public function handle($method, $uri) {
        $uri = rtrim($uri, '/');
        
        if ($method === 'POST' && $uri === '/api/student/login') {
            $this->controller->login();
        } elseif ($method === 'POST' && $uri === '/api/student/logout') {
            $this->controller->logout();
        } elseif ($method === 'GET' && $uri === '/api/student/verify') {
            $this->controller->verify();
        } elseif ($method === 'GET' && $uri === '/api/student/profile') {
            $this->controller->getProfile();
        } elseif ($method === 'PUT' && $uri === '/api/student/profile') {
            $this->controller->updateProfile();
        } elseif ($method === 'POST' && $uri === '/api/student/forgot-password') {
            $this->controller->forgotPassword();
        } elseif ($method === 'POST' && $uri === '/api/student/verify-otp') {
            $this->controller->verifyOtp();
        } elseif ($method === 'POST' && $uri === '/api/student/reset-password') {
            $this->controller->resetPassword();
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Route not found']);
        }
    }
}
