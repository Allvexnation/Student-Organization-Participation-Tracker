<?php

require_once __DIR__ . '/../../controller/Contacts/ContactsController.php';

class ContactsRoutes {
    private $controller;

    public function __construct() {
        $this->controller = new ContactsController();
    }

    public function handle($method, $uri) {
        $uri = trim($uri, '/');
        $uriParts = explode('/', $uri);

        if ($method === 'POST' && count($uriParts) === 3 && $uriParts[2] === 'appeal') {
            $this->controller->submitAppeal();
            return true;
        }

        if ($method === 'GET' && count($uriParts) === 2) {
            $this->controller->getAllAppeals();
            return true;
        }

        if ($method === 'GET' && count($uriParts) === 3 && is_numeric($uriParts[2])) {
            $this->controller->getAppealById($uriParts[2]);
            return true;
        }

        if ($method === 'PUT' && count($uriParts) === 3 && $uriParts[2] === 'status') {
            $this->controller->updateStatus();
            return true;
        }

        if ($method === 'POST' && count($uriParts) === 3 && $uriParts[2] === 'reply') {
            $this->controller->sendReply();
            return true;
        }

        if ($method === 'POST' && count($uriParts) === 3 && $uriParts[2] === 'contact') {
            $this->controller->submitContact();
            return true;
        }

        if ($method === 'POST' && count($uriParts) === 3 && $uriParts[2] === 'report') {
            $this->controller->submitReport();
            return true;
        }

        if ($method === 'GET' && count($uriParts) === 3 && $uriParts[2] === 'support') {
            $this->controller->getAllContacts();
            return true;
        }

        if ($method === 'GET' && count($uriParts) === 4 && $uriParts[2] === 'support' && is_numeric($uriParts[3])) {
            $this->controller->getContactById($uriParts[3]);
            return true;
        }

        if ($method === 'PUT' && count($uriParts) === 4 && $uriParts[2] === 'support' && $uriParts[3] === 'status') {
            $this->controller->updateContactStatus();
            return true;
        }

        if ($method === 'POST' && count($uriParts) === 4 && $uriParts[2] === 'support' && $uriParts[3] === 'reply') {
            $this->controller->sendContactReply();
            return true;
        }

        if ($method === 'GET' && count($uriParts) === 3 && $uriParts[2] === 'reports') {
            $this->controller->getAllReports();
            return true;
        }

        if ($method === 'GET' && count($uriParts) === 4 && $uriParts[2] === 'reports' && is_numeric($uriParts[3])) {
            $this->controller->getReportById($uriParts[3]);
            return true;
        }

        if ($method === 'PUT' && count($uriParts) === 4 && $uriParts[2] === 'reports' && $uriParts[3] === 'status') {
            $this->controller->updateReportStatus();
            return true;
        }

        if ($method === 'POST' && count($uriParts) === 4 && $uriParts[2] === 'reports' && $uriParts[3] === 'reply') {
            $this->controller->sendReportReply();
            return true;
        }

        http_response_code(404);
        echo json_encode(['message' => 'Route not found']);
    }
}
