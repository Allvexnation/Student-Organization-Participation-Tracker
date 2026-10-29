<?php

require_once __DIR__ . '/../../controller/Adviser/AdviserOrganizationController.php';

class AdviserOrganizationRoutes {
    private $controller;

    public function __construct() {
        $this->controller = new AdviserOrganizationController();
    }

    public function handle($method, $uri) {
        $uri = rtrim($uri, '/');

        if ($method === 'GET' && $uri === '/api/adviser/organization') {
            $this->controller->getOrganization();
        } elseif ($method === 'GET' && $uri === '/api/adviser/organizations') {
            $this->controller->getAllOrganizations();
        } elseif ($method === 'PUT' && $uri === '/api/adviser/organization') {
            $this->controller->updateOrganization();
        } elseif ($method === 'PUT' && $uri === '/api/adviser/current-organization') {
            $this->controller->setCurrentOrganization();
        }

        elseif ($method === 'GET' && $uri === '/api/adviser/organization-memberships') {
            $this->controller->getMemberships();
        } elseif ($method === 'GET' && preg_match('#^/api/adviser/organization-memberships/(\d+)$#', $uri, $matches)) {
            $this->controller->getMembership($matches[1]);
        } elseif ($method === 'GET' && preg_match('#^/api/adviser/organization-memberships-by-org/(\d+)$#', $uri, $matches)) {
            $this->controller->getMembershipsByOrganizationId($matches[1]);
        } elseif ($method === 'POST' && $uri === '/api/adviser/organization-memberships') {
            $this->controller->createMembership();
        } elseif ($method === 'PUT' && preg_match('#^/api/adviser/organization-memberships/(\d+)$#', $uri, $matches)) {
            $this->controller->updateMembership($matches[1]);
        } elseif ($method === 'DELETE' && preg_match('#^/api/adviser/organization-memberships/(\d+)$#', $uri, $matches)) {
            $this->controller->deleteMembership($matches[1]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Route not found']);
        }
    }
}
