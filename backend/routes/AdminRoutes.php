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
        } elseif ($method === 'POST' && $uri === '/api/admin/lookup') {
            $this->controller->lookupAccount();
        } elseif ($method === 'POST' && $uri === '/api/admin/logout') {
            $this->controller->logout();
        } elseif ($method === 'POST' && $uri === '/api/admin/forgot-password') {
            $this->controller->forgotPassword();
        } elseif ($method === 'POST' && $uri === '/api/admin/verify-otp') {
            $this->controller->verifyOtp();
        } elseif ($method === 'POST' && $uri === '/api/admin/reset-password') {
            $this->controller->resetPassword();
        } elseif ($method === 'GET' && $uri === '/api/admin/profile') {
            $this->controller->getProfile();
        } elseif ($method === 'PUT' && $uri === '/api/admin/profile') {
            $this->controller->updateProfile();
        } elseif ($method === 'GET' && $uri === '/api/admin/dashboard/counts') {
            $this->controller->getDashboardCounts();
        } elseif ($method === 'GET' && $uri === '/api/admin/admins') {
            $this->controller->getAll();
        } elseif ($method === 'GET' && preg_match('#^/api/admin/admins/(\d+)$#', $uri, $matches)) {
            $this->controller->getOne($matches[1]);
        } elseif ($method === 'POST' && $uri === '/api/admin/admins') {
            $this->controller->create();
        } elseif ($method === 'PUT' && preg_match('#^/api/admin/admins/(\d+)$#', $uri, $matches)) {
            $this->controller->update($matches[1]);
        } elseif ($method === 'DELETE' && preg_match('#^/api/admin/admins/(\d+)$#', $uri, $matches)) {
            $this->controller->delete($matches[1]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Route not found']);
        }
    }
}
