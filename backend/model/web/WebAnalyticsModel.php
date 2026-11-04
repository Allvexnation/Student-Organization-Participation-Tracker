<?php

require_once __DIR__ . '/../../config/db.php';

class WebAnalyticsModel {
    private $conn;
    private $table_name = "web_analytics";

    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
    }

    public function create($data) {
        $query = "INSERT INTO " . $this->table_name . "
                  (route, ip_address, device_type, browser, os, user_agent, screen_resolution, language, country, country_code, region, city, latitude, longitude, user_id, user_type, visited_at, active, url)
                  VALUES (:route, :ip_address, :device_type, :browser, :os, :user_agent, :screen_resolution, :language, :country, :country_code, :region, :city, :latitude, :longitude, :user_id, :user_type, :visited_at, :active, :url)";

        try {
            $stmt = $this->conn->prepare($query);

            $validDeviceTypes = ['Desktop', 'Mobile', 'Tablet'];
            $deviceType = isset($data['device_type']) && in_array($data['device_type'], $validDeviceTypes) ? $data['device_type'] : null;

            $validUserTypes = ['admin', 'adviser', 'student'];
            $userType = isset($data['user_type']) && in_array($data['user_type'], $validUserTypes) ? $data['user_type'] : null;

            $stmt->bindParam(':route', $data['route']);
            $stmt->bindParam(':ip_address', $data['ip_address']);
            $stmt->bindParam(':device_type', $deviceType);
            $stmt->bindParam(':browser', $data['browser']);
            $stmt->bindParam(':os', $data['os']);
            $stmt->bindParam(':user_agent', $data['user_agent']);
            $stmt->bindParam(':screen_resolution', $data['screen_resolution']);
            $stmt->bindParam(':language', $data['language']);
            $stmt->bindParam(':country', $data['country']);
            $stmt->bindParam(':country_code', $data['country_code']);
            $stmt->bindParam(':region', $data['region']);
            $stmt->bindParam(':city', $data['city']);
            $stmt->bindParam(':latitude', $data['latitude']);
            $stmt->bindParam(':longitude', $data['longitude']);
            $stmt->bindParam(':user_id', $data['user_id']);
            $stmt->bindParam(':user_type', $userType);
            $stmt->bindParam(':visited_at', $data['visited_at']);
            $stmt->bindParam(':active', $data['active']);
            $stmt->bindParam(':url', $data['url']);
            
            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error creating web analytics: " . $e->getMessage());
            return false;
        }
    }

    public function readAll($limit = null, $offset = null) {
        $query = "SELECT id, route, ip_address, device_type, browser, os, user_agent, screen_resolution, language, country, country_code, region, city, latitude, longitude, user_id, user_type, visited_at, active, url 
                  FROM " . $this->table_name . " 
                  ORDER BY visited_at DESC";

        if ($limit !== null) {
            $query .= " LIMIT :limit";
            if ($offset !== null) {
                $query .= " OFFSET :offset";
            }
        }

        try {
            $stmt = $this->conn->prepare($query);
            
            if ($limit !== null) {
                $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
                if ($offset !== null) {
                    $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
                }
            }
            
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            echo "Error reading web analytics: " . $e->getMessage();
            return false;
        }
    }

    public function readOne($id) {
        $query = "SELECT id, route, ip_address, device_type, browser, os, user_agent, screen_resolution, language, country, country_code, region, city, latitude, longitude, user_id, user_type, visited_at, active, url 
                  FROM " . $this->table_name . " 
                  WHERE id = :id 
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            echo "Error reading web analytics: " . $e->getMessage();
            return false;
        }
    }

    public function readByRoute($route) {
        $query = "SELECT id, route, ip_address, device_type, browser, os, user_agent, screen_resolution, language, country, country_code, region, city, latitude, longitude, user_id, user_type, visited_at, active, url 
                  FROM " . $this->table_name . " 
                  WHERE route = :route 
                  ORDER BY visited_at DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':route', $route);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            echo "Error reading web analytics by route: " . $e->getMessage();
            return false;
        }
    }

    public function readByDateRange($startDate, $endDate) {
        $query = "SELECT id, route, ip_address, device_type, browser, os, user_agent, screen_resolution, language, country, country_code, region, city, latitude, longitude, user_id, user_type, visited_at, active, url 
                  FROM " . $this->table_name . " 
                  WHERE visited_at BETWEEN :start_date AND :end_date 
                  ORDER BY visited_at DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':start_date', $startDate);
            $stmt->bindParam(':end_date', $endDate);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            echo "Error reading web analytics by date range: " . $e->getMessage();
            return false;
        }
    }

    public function getStats() {
        $query = "SELECT 
                    COUNT(*) as total_visits,
                    COUNT(DISTINCT ip_address) as unique_visitors,
                    COUNT(DISTINCT route) as unique_routes,
                    COUNT(CASE WHEN user_type IS NOT NULL THEN 1 END) as authenticated_visits,
                    COUNT(CASE WHEN user_type IS NULL THEN 1 END) as anonymous_visits
                  FROM " . $this->table_name;

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            echo "Error getting web analytics stats: " . $e->getMessage();
            return false;
        }
    }

    public function getRouteStats() {
        $query = "SELECT 
                    route,
                    COUNT(*) as visit_count,
                    COUNT(DISTINCT ip_address) as unique_visitors
                  FROM " . $this->table_name . " 
                  GROUP BY route 
                  ORDER BY visit_count DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            echo "Error getting route stats: " . $e->getMessage();
            return false;
        }
    }

    public function getDeviceStats() {
        $query = "SELECT 
                    device_type,
                    COUNT(*) as count
                  FROM " . $this->table_name . " 
                  GROUP BY device_type 
                  ORDER BY count DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            echo "Error getting device stats: " . $e->getMessage();
            return false;
        }
    }

    public function getCountryStats() {
        $query = "SELECT 
                    country,
                    country_code,
                    COUNT(*) as count
                  FROM " . $this->table_name . " 
                  WHERE country IS NOT NULL
                  GROUP BY country, country_code 
                  ORDER BY count DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            echo "Error getting country stats: " . $e->getMessage();
            return false;
        }
    }

    public function delete($id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            
            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            echo "Error deleting web analytics: " . $e->getMessage();
            return false;
        }
    }

    public function deleteOlderThan($date) {
        $query = "DELETE FROM " . $this->table_name . " WHERE visited_at < :date";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':date', $date);
            
            if($stmt->execute()) {
                return $stmt->rowCount();
            }
            return false;
        } catch(PDOException $e) {
            echo "Error deleting old web analytics: " . $e->getMessage();
            return false;
        }
    }

    public function updateActiveStatus($id, $active) {
        $query = "UPDATE " . $this->table_name . " SET active = :active WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':active', $active, PDO::PARAM_INT);
            
            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error updating active status: " . $e->getMessage());
            return false;
        }
    }

    public function updateUrl($id, $url) {
        $query = "UPDATE " . $this->table_name . " SET url = :url WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':url', $url);
            
            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error updating url: " . $e->getMessage());
            return false;
        }
    }

    public function getActiveSessions() {
        $query = "SELECT id, route, ip_address, device_type, browser, os, user_agent, screen_resolution, language, country, country_code, region, city, latitude, longitude, user_id, user_type, visited_at, active, url 
                  FROM " . $this->table_name . " 
                  WHERE active = 1 
                  ORDER BY visited_at DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            error_log("Error getting active sessions: " . $e->getMessage());
            return false;
        }
    }
}
