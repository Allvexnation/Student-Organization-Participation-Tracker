<?php

require_once __DIR__ . '/../model/HelloModel.php';
require_once __DIR__ . '/../config/jwt.php';

class HelloController {
    private $helloModel;

    public function __construct() {
        $this->helloModel = new HelloModel();
    }

    /**
     * Display a listing of the resource.
     */
    public function index() {
        header('Content-Type: application/json');

        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;

        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $result = $this->helloModel->readAll();

        if ($result) {
            http_response_code(200);
            echo json_encode(['data' => $result]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'No records found']);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store() {
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

        $result = $this->helloModel->create($data);

        if ($result) {
            http_response_code(201);
            echo json_encode(['message' => 'Created successfully', 'id' => $result]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to create']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id) {
        header('Content-Type: application/json');

        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;

        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $result = $this->helloModel->readOne($id);

        if ($result) {
            http_response_code(200);
            echo json_encode(['data' => $result]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Record not found']);
        }
    }

    /**
     * Update the specified resource in storage.
     */
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

        $result = $this->helloModel->update($id, $data);

        if ($result) {
            http_response_code(200);
            echo json_encode(['message' => 'Updated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id) {
        header('Content-Type: application/json');

        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;

        if (!$token || !JWT::validate($token)) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized']);
            return;
        }

        $result = $this->helloModel->delete($id);

        if ($result) {
            http_response_code(200);
            echo json_encode(['message' => 'Deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to delete']);
        }
    }
}
