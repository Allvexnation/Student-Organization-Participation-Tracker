<?php

require_once __DIR__ . '/../model/EventRegistrationsModel.php';
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../cache/CacheService.php';

class EventRegistrationsController {
    private $eventRegistrationsModel;

    public function __construct() {
        $this->eventRegistrationsModel = new EventRegistrationsModel();
    }

    public function getAll() {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $eventRegistrations = CacheService::remember('event_registrations_all', 300, function() {
            return $this->eventRegistrationsModel->readAll();
        });

        if ($eventRegistrations !== false) {
            http_response_code(200);
            echo json_encode(['event_registrations' => $eventRegistrations]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to fetch event registrations']);
        }
    }

    public function getOne($id) {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $eventRegistration = $this->eventRegistrationsModel->readOne($id);

        if ($eventRegistration) {
            http_response_code(200);
            echo json_encode(['event_registration' => $eventRegistration]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Event registration not found']);
        }
    }

    public function create() {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid data']);
            return;
        }

        if (!isset($data['event_id']) || !isset($data['student_id'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $result = $this->eventRegistrationsModel->create($data);
        if ($result) {
            CacheService::forget('event_registrations_all');
        }

        if ($result) {
            http_response_code(201);
            echo json_encode(['message' => 'Event registration created successfully', 'id' => $result]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to create event registration']);
        }
    }

    public function update($id) {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid data']);
            return;
        }

        if (!isset($data['event_id']) || !isset($data['student_id'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $result = $this->eventRegistrationsModel->update($id, $data);
        if ($result) {
            CacheService::forget('event_registrations_all');
            CacheService::forget('event_registration_' . $id);
        }

        if ($result) {
            $eventRegistration = $this->eventRegistrationsModel->readOne($id);
            http_response_code(200);
            echo json_encode([
                'message' => 'Event registration updated successfully',
                'event_registration' => $eventRegistration
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update event registration']);
        }
    }

    public function delete($id) {
        header('Content-Type: application/json');
        
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $result = $this->eventRegistrationsModel->delete($id);
        if ($result) {
            CacheService::forget('event_registrations_all');
            CacheService::forget('event_registration_' . $id);
        }

        if ($result) {
            http_response_code(200);
            echo json_encode(['message' => 'Event registration deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to delete event registration']);
        }
    }
}
