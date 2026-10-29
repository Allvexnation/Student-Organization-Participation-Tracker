<?php

require_once __DIR__ . '/../model/EventsModel.php';
require_once __DIR__ . '/../config/jwt.php';

class EventsController {
    private $eventsModel;

    public function __construct() {
        $this->eventsModel = new EventsModel();
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

        $events = $this->eventsModel->readAll();

        if ($events !== false) {
            http_response_code(200);
            echo json_encode(['events' => $events]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to fetch events']);
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

        $event = $this->eventsModel->readOne($id);

        if ($event) {
            http_response_code(200);
            echo json_encode(['event' => $event]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Event not found']);
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

        if (!isset($data['organization_ids']) || !is_array($data['organization_ids']) || empty($data['organization_ids']) || !isset($data['title']) || !isset($data['event_day_start']) || !isset($data['event_day_end']) || !isset($data['event_category'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $result = $this->eventsModel->create($data);

        if ($result) {
            http_response_code(201);
            echo json_encode(['message' => 'Event created successfully', 'id' => $result]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to create event']);
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

        if (!isset($data['organization_ids']) || !is_array($data['organization_ids']) || empty($data['organization_ids']) || !isset($data['title']) || !isset($data['event_day_start']) || !isset($data['event_day_end']) || !isset($data['event_category'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $result = $this->eventsModel->update($id, $data);

        if ($result) {
            $event = $this->eventsModel->readOne($id);
            http_response_code(200);
            echo json_encode([
                'message' => 'Event updated successfully',
                'event' => $event
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update event']);
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

        $result = $this->eventsModel->delete($id);

        if ($result) {
            http_response_code(200);
            echo json_encode(['message' => 'Event deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to delete event']);
        }
    }
}
