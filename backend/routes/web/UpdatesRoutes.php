<?php

require_once __DIR__ . '/../../controller/web/UpdatesController.php';

class UpdatesRoutes {
    private $controller;

    public function __construct() {
        $this->controller = new UpdatesController();
    }

    public function handle($method, $uri) {
        $uri = rtrim($uri, '/');

        if ($method === 'GET' && (strpos($uri, '/api/web/updates/download') === 0 || strpos($uri, '/api/web/updates/asset') === 0)) {
            $filename = null;
            if (preg_match('#^/api/web/updates/(?:download|asset)/(.+)$#', $uri, $matches)) {
                $filename = urldecode($matches[1]);
            }
            $this->controller->downloadAsset($filename);
            return;
        }

        if ($method === 'GET' && preg_match('#^/api/web/updates/(\d+)/download-file$#', $uri, $matches)) {
            $id = $matches[1];
            $this->controller->downloadAssetFile($id);
            return;
        }

        $id = null;
        if (preg_match('#^/api/web/updates/(\d+)$#', $uri, $matches)) {
            $id = $matches[1];
        }

        if ($method === 'GET' && $uri === '/api/web/updates') {
            $this->controller->getAll();
        } elseif ($method === 'GET' && $uri === '/api/web/updates/active') {
            $this->controller->getActive();
        } elseif ($method === 'GET' && $id !== null) {
            $this->controller->getOne($id);
        } elseif ($method === 'POST' && $uri === '/api/web/updates') {
            $this->controller->create();
        } elseif ($method === 'PUT' && $id !== null) {
            $this->controller->update($id);
        } elseif ($method === 'DELETE' && $id !== null) {
            $this->controller->delete($id);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Route not found']);
        }
    }
}
