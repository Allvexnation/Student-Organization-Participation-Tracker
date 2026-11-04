<?php

require_once __DIR__ . '/../../config/db.php';

class UpdatesModel {
    private $conn;
    private $table_name = "updates";

    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
    }

    public function disableBufferedQuery() {
        $this->conn->setAttribute(PDO::MYSQL_ATTR_USE_BUFFERED_QUERY, false);
    }

    public function enableBufferedQuery() {
        $this->conn->setAttribute(PDO::MYSQL_ATTR_USE_BUFFERED_QUERY, true);
    }

    public function create($data) {
        $query = "INSERT INTO " . $this->table_name . "
                  (version, name, branch, github_branch_link, readme_content, readme_filename, assets, assets_file, is_updated, closable_type, is_active)
                  VALUES (:version, :name, :branch, :github_branch_link, :readme_content, :readme_filename, :assets, :assets_file, :is_updated, :closable_type, :is_active)";

        try {
            $stmt = $this->conn->prepare($query);

            $branch = !empty($data['branch']) ? $data['branch'] : 'main';
            $githubBranchLink = $data['github_branch_link'] ?? null;
            $assets = isset($data['assets']) ? (is_array($data['assets']) ? json_encode($data['assets']) : $data['assets']) : null;
            $assetsFile = $data['assets_file'] ?? null;
            $is_updated = isset($data['is_updated']) ? (int)$data['is_updated'] : 0;
            $isActive = isset($data['is_active']) ? (int)$data['is_active'] : 1;

            $stmt->bindParam(':version', $data['version']);
            $stmt->bindParam(':name', $data['name']);
            $stmt->bindParam(':branch', $branch);
            $stmt->bindParam(':github_branch_link', $githubBranchLink);
            $stmt->bindParam(':readme_content', $data['readme_content']);
            $stmt->bindParam(':readme_filename', $data['readme_filename']);
            $stmt->bindParam(':assets', $assets);
            $stmt->bindParam(':assets_file', $assetsFile);
            $stmt->bindParam(':is_updated', $is_updated);
            $stmt->bindParam(':closable_type', $data['closable_type']);
            $stmt->bindParam(':is_active', $isActive);
            
            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        } catch(PDOException $e) {
            echo "Error creating update: " . $e->getMessage();
            return false;
        }
    }

    public function readAll() {
        $query = "SELECT id, version, name, branch, github_branch_link, readme_content, readme_filename, assets, assets_file, is_updated, closable_type, is_active, created_at, updated_at 
                  FROM " . $this->table_name . " 
                  ORDER BY created_at DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            echo "Error reading updates: " . $e->getMessage();
            return false;
        }
    }

    public function readOne($id) {
        $query = "SELECT id, version, name, branch, github_branch_link, readme_content, readme_filename, assets, assets_file, is_updated, closable_type, is_active, created_at, updated_at 
                  FROM " . $this->table_name . " 
                  WHERE id = :id 
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            echo "Error reading update: " . $e->getMessage();
            return false;
        }
    }

    public function getActiveUpdates() {
        $query = "SELECT id, version, name, branch, github_branch_link, readme_content, readme_filename, assets, assets_file, is_updated, closable_type, is_active, created_at, updated_at 
                  FROM " . $this->table_name . " 
                  WHERE is_active = 1 
                  ORDER BY created_at DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            echo "Error reading active updates: " . $e->getMessage();
            return false;
        }
    }

    public function update($id, $data) {
        $query = "UPDATE " . $this->table_name . "
                  SET version = :version,
                      name = :name,
                      branch = :branch,
                      github_branch_link = :github_branch_link,
                      readme_content = :readme_content,
                      readme_filename = :readme_filename,
                      assets = :assets,
                      assets_file = :assets_file,
                      is_updated = :is_updated,
                      closable_type = :closable_type,
                      is_active = :is_active
                  WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);

            $branch = !empty($data['branch']) ? $data['branch'] : 'main';
            $githubBranchLink = $data['github_branch_link'] ?? null;
            $assets = isset($data['assets']) ? (is_array($data['assets']) ? json_encode($data['assets']) : $data['assets']) : null;
            $assetsFile = $data['assets_file'] ?? null;
            $is_updated = isset($data['is_updated']) ? (int)$data['is_updated'] : 1;
            $isActive = isset($data['is_active']) ? (int)$data['is_active'] : 1;

            $stmt->bindParam(':version', $data['version']);
            $stmt->bindParam(':name', $data['name']);
            $stmt->bindParam(':branch', $branch);
            $stmt->bindParam(':github_branch_link', $githubBranchLink);
            $stmt->bindParam(':readme_content', $data['readme_content']);
            $stmt->bindParam(':readme_filename', $data['readme_filename']);
            $stmt->bindParam(':assets', $assets);
            $stmt->bindParam(':assets_file', $assetsFile);
            $stmt->bindParam(':is_updated', $is_updated);
            $stmt->bindParam(':closable_type', $data['closable_type']);
            $stmt->bindParam(':is_active', $isActive);
            $stmt->bindParam(':id', $id);
            
            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            echo "Error updating update: " . $e->getMessage();
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
            echo "Error deleting update: " . $e->getMessage();
            return false;
        }
    }
}
