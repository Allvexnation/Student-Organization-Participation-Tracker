<?php

require_once __DIR__ . '/../../model/web/UpdatesModel.php';

class UpdatesController {
    private $updatesModel;
    private $templateFilesDir;
    private $templateDir;

    public function __construct() {
        $this->updatesModel = new UpdatesModel();
        $this->templateFilesDir = __DIR__ . '/../../template/Updates/Files';
        $this->templateDir = __DIR__ . '/../../template/Updates';
    }

    public function getAll() {
        header('Content-Type: application/json');
        
        $updates = $this->updatesModel->readAll();
        
        if ($updates !== false) {
            http_response_code(200);
            echo json_encode(['updates' => $updates]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Error fetching updates']);
        }
    }

    public function getActive() {
        header('Content-Type: application/json');
        
        $updates = $this->updatesModel->getActiveUpdates();
        
        if ($updates !== false) {
            http_response_code(200);
            echo json_encode(['updates' => $updates]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Error fetching active updates']);
        }
    }

    public function getOne($id) {
        header('Content-Type: application/json');
        
        $update = $this->updatesModel->readOne($id);
        
        if ($update) {
            http_response_code(200);
            echo json_encode(['update' => $update]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Update not found']);
        }
    }

    public function create() {
        header('Content-Type: application/json');
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid data']);
            return;
        }

        if (!isset($data['version']) || !isset($data['name']) || !isset($data['readme_content']) || !isset($data['closable_type'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Version, name, readme_content, and closable_type are required']);
            return;
        }

        $assets = isset($data['assets']) ? $data['assets'] : null;
        if (is_array($assets)) {
            $assets = json_encode($assets);
        }

        $assetsFile = isset($data['assets_file']) ? $data['assets_file'] : null;

        $updateData = [
            'version' => $data['version'],
            'name' => $data['name'],
            'branch' => !empty($data['branch']) ? $data['branch'] : 'main',
            'github_branch_link' => isset($data['github_branch_link']) ? $data['github_branch_link'] : null,
            'readme_content' => $data['readme_content'],
            'readme_filename' => isset($data['readme_filename']) ? $data['readme_filename'] : null,
            'assets' => $assets,
            'assets_file' => $assetsFile,
            'is_updated' => isset($data['is_updated']) ? (int)$data['is_updated'] : 0,
            'closable_type' => $data['closable_type'],
            'is_active' => isset($data['is_active']) ? (int)$data['is_active'] : 1
        ];

        $result = $this->updatesModel->create($updateData);

        if ($result) {
            http_response_code(201);
            echo json_encode([
                'message' => 'Update created successfully',
                'id' => $result
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to create update']);
        }
    }

    public function update($id) {
        header('Content-Type: application/json');
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid data']);
            return;
        }

        $existing = $this->updatesModel->readOne($id);
        if (!$existing) {
            http_response_code(404);
            echo json_encode(['message' => 'Update not found']);
            return;
        }

        $assets = isset($data['assets']) ? $data['assets'] : $existing['assets'];
        if (is_array($assets)) {
            $assets = json_encode($assets);
        }

        $assetsFile = isset($data['assets_file']) ? $data['assets_file'] : $existing['assets_file'];

        $updateData = [
            'version' => isset($data['version']) ? $data['version'] : $existing['version'],
            'name' => isset($data['name']) ? $data['name'] : $existing['name'],
            'branch' => isset($data['branch']) ? $data['branch'] : ($existing['branch'] ?: 'main'),
            'github_branch_link' => isset($data['github_branch_link']) ? $data['github_branch_link'] : $existing['github_branch_link'],
            'readme_content' => isset($data['readme_content']) ? $data['readme_content'] : $existing['readme_content'],
            'readme_filename' => array_key_exists('readme_filename', $data) ? $data['readme_filename'] : $existing['readme_filename'],
            'assets' => $assets,
            'assets_file' => $assetsFile,
            'is_updated' => 1,
            'closable_type' => isset($data['closable_type']) ? $data['closable_type'] : $existing['closable_type'],
            'is_active' => isset($data['is_active']) ? (int)$data['is_active'] : (int)$existing['is_active']
        ];

        $result = $this->updatesModel->update($id, $updateData);

        if ($result) {
            $update = $this->updatesModel->readOne($id);
            http_response_code(200);
            echo json_encode([
                'message' => 'Update updated successfully',
                'update' => $update
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update update']);
        }
    }

    public function delete($id) {
        header('Content-Type: application/json');
        
        $result = $this->updatesModel->delete($id);

        if ($result) {
            http_response_code(200);
            echo json_encode(['message' => 'Update deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to delete update']);
        }
    }

    public function downloadAsset($filename = null) {
        if (!$filename && isset($_GET['file'])) {
            $filename = $_GET['file'];
        }

        if (empty($filename)) {
            header('Content-Type: application/json');
            http_response_code(400);
            echo json_encode(['message' => 'Filename is required']);
            exit();
        }

        $safeName = basename($filename);

        $possiblePaths = [
            $this->templateFilesDir . '/' . $safeName,
            $this->templateDir . '/' . $safeName
        ];

        $filePath = null;
        foreach ($possiblePaths as $path) {
            if (file_exists($path) && is_file($path)) {
                $filePath = $path;
                break;
            }
        }

        if (!$filePath) {
            header('Content-Type: application/json');
            http_response_code(404);
            echo json_encode(['message' => 'Asset file not found: ' . $safeName]);
            exit();
        }

        $ext = strtolower(pathinfo($safeName, PATHINFO_EXTENSION));
        $mimeTypes = [
            'zip'  => 'application/zip',
            'gz'   => 'application/gzip',
            'tar'  => 'application/x-tar',
            'md'   => 'text/markdown; charset=utf-8',
            'txt'  => 'text/plain; charset=utf-8',
            'pdf'  => 'application/pdf',
            'json' => 'application/json; charset=utf-8',
            'html' => 'text/html; charset=utf-8',
            'png'  => 'image/png',
            'jpg'  => 'image/jpeg',
            'jpeg' => 'image/jpeg'
        ];
        $contentType = isset($mimeTypes[$ext]) ? $mimeTypes[$ext] : 'application/octet-stream';

        if (ob_get_level()) {
            ob_end_clean();
        }

        header('Content-Description: File Transfer');
        header('Content-Type: ' . $contentType);
        header('Content-Disposition: attachment; filename="' . $safeName . '"');
        header('Content-Transfer-Encoding: binary');
        header('Expires: 0');
        header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
        header('Pragma: public');
        header('Content-Length: ' . filesize($filePath));

        readfile($filePath);
        exit();
    }

    public function downloadAssetFile($id) {

        $update = $this->updatesModel->readOne($id);

        if (!$update) {
            header('Content-Type: application/json');
            http_response_code(404);
            echo json_encode(['message' => 'Update not found']);
            exit();
        }

        if (empty($update['assets_file'])) {
            header('Content-Type: application/json');
            http_response_code(404);
            echo json_encode(['message' => 'No asset file attached to this update']);
            exit();
        }

        header('Location: ' . $update['assets_file']);
        exit();
    }
}
