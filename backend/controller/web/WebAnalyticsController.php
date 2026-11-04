<?php

require_once __DIR__ . '/../../model/web/WebAnalyticsModel.php';

class WebAnalyticsController {
    private $webAnalyticsModel;

    public function __construct() {
        $this->webAnalyticsModel = new WebAnalyticsModel();
    }

    public function track() {
        header('Content-Type: application/json');
        
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data) {
                http_response_code(400);
                echo json_encode(['message' => 'Invalid data']);
                return;
            }

            if (!isset($data['route'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Route is required']);
                return;
            }

            $visitedAt = isset($data['visited_at']) ? $data['visited_at'] : date('Y-m-d H:i:s');
            if (preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/', $visitedAt)) {
                $visitedAt = date('Y-m-d H:i:s', strtotime($visitedAt));
            }

            $analyticsData = [
                'route' => $data['route'],
                'ip_address' => isset($data['ip_address']) ? $data['ip_address'] : null,
                'device_type' => isset($data['device_type']) ? $data['device_type'] : null,
                'browser' => isset($data['browser']) ? $data['browser'] : null,
                'os' => isset($data['os']) ? $data['os'] : null,
                'user_agent' => isset($data['user_agent']) ? $data['user_agent'] : null,
                'screen_resolution' => isset($data['screen_resolution']) ? $data['screen_resolution'] : null,
                'language' => isset($data['language']) ? $data['language'] : null,
                'country' => isset($data['country']) ? $data['country'] : null,
                'country_code' => isset($data['country_code']) ? $data['country_code'] : null,
                'region' => isset($data['region']) ? $data['region'] : null,
                'city' => isset($data['city']) ? $data['city'] : null,
                'latitude' => isset($data['latitude']) ? $data['latitude'] : null,
                'longitude' => isset($data['longitude']) ? $data['longitude'] : null,
                'user_id' => isset($data['user_id']) ? $data['user_id'] : null,
                'user_type' => isset($data['user_type']) ? $data['user_type'] : null,
                'visited_at' => $visitedAt,
                'active' => isset($data['active']) ? $data['active'] : 0,
                'url' => isset($data['url']) ? $data['url'] : null
            ];

            $result = $this->webAnalyticsModel->create($analyticsData);

            if ($result) {
                http_response_code(201);
                echo json_encode([
                    'message' => 'Visitor tracked successfully',
                    'id' => $result
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['message' => 'Failed to track visitor']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to track visitor: ' . $e->getMessage()]);
        }
    }

    public function getAll() {
        header('Content-Type: application/json');
        
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : null;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : null;
        
        $analytics = $this->webAnalyticsModel->readAll($limit, $offset);
        
        if ($analytics !== false) {
            http_response_code(200);
            echo json_encode(['analytics' => $analytics]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Error fetching analytics']);
        }
    }

    public function getOne($id) {
        header('Content-Type: application/json');
        
        $analytics = $this->webAnalyticsModel->readOne($id);
        
        if ($analytics) {
            http_response_code(200);
            echo json_encode(['analytics' => $analytics]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Analytics record not found']);
        }
    }

    public function getByRoute($route) {
        header('Content-Type: application/json');
        
        $analytics = $this->webAnalyticsModel->readByRoute($route);
        
        if ($analytics !== false) {
            http_response_code(200);
            echo json_encode(['analytics' => $analytics]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Error fetching analytics by route']);
        }
    }

    public function getByDate($startDate, $endDate) {
        header('Content-Type: application/json');
        
        $analytics = $this->webAnalyticsModel->readByDateRange($startDate, $endDate);
        
        if ($analytics !== false) {
            http_response_code(200);
            echo json_encode(['analytics' => $analytics]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Error fetching analytics by date range']);
        }
    }

    public function getStats() {
        header('Content-Type: application/json');
        
        $stats = $this->webAnalyticsModel->getStats();
        $routeStats = $this->webAnalyticsModel->getRouteStats();
        $deviceStats = $this->webAnalyticsModel->getDeviceStats();
        $countryStats = $this->webAnalyticsModel->getCountryStats();
        
        if ($stats !== false && $routeStats !== false && $deviceStats !== false && $countryStats !== false) {
            http_response_code(200);
            echo json_encode([
                'stats' => $stats,
                'route_stats' => $routeStats,
                'device_stats' => $deviceStats,
                'country_stats' => $countryStats
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Error fetching analytics stats']);
        }
    }

    public function delete($id) {
        header('Content-Type: application/json');
        
        $result = $this->webAnalyticsModel->delete($id);

        if ($result) {
            http_response_code(200);
            echo json_encode(['message' => 'Analytics record deleted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to delete analytics record']);
        }
    }

    public function updateActive() {
        header('Content-Type: application/json');
        
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data || !isset($data['id']) || !isset($data['active'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Invalid data']);
                return;
            }

            $result = $this->webAnalyticsModel->updateActiveStatus($data['id'], $data['active']);

            if ($result) {
                http_response_code(200);
                echo json_encode(['message' => 'Active status updated successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['message' => 'Failed to update active status']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update active status: ' . $e->getMessage()]);
        }
    }

    public function updateUrl() {
        header('Content-Type: application/json');
        
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data || !isset($data['id']) || !isset($data['url'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Invalid data']);
                return;
            }

            $result = $this->webAnalyticsModel->updateUrl($data['id'], $data['url']);

            if ($result) {
                http_response_code(200);
                echo json_encode(['message' => 'URL updated successfully']);
            } else {
                http_response_code(500);
                echo json_encode(['message' => 'Failed to update URL']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update URL: ' . $e->getMessage()]);
        }
    }

    public function getActiveSessions() {
        header('Content-Type: application/json');
        
        $sessions = $this->webAnalyticsModel->getActiveSessions();
        
        if ($sessions !== false) {
            http_response_code(200);
            echo json_encode(['sessions' => $sessions]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Error fetching active sessions']);
        }
    }
}
