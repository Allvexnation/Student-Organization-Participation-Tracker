<?php

require_once __DIR__ . '/../../config/db.php';

class AdviserOrganizationModel {
    private $conn;
    private $organizations_table = "organizations";
    private $memberships_table = "organization_memberships";

    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
        if (!$this->conn) {
            error_log("Failed to establish database connection in AdviserOrganizationModel");
        }
    }

    public function getOrganizationByAdviserId($adviser_id) {
        if (!$this->conn) {
            error_log("Database connection is null");
            return false;
        }

        $query = "SELECT o.id, o.org_code, o.name, o.description, o.adviser_id, o.status, o.updated_at, o.created_at
                  FROM " . $this->organizations_table . " o
                  WHERE o.adviser_id = :adviser_id 
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':adviser_id', $adviser_id);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return $result;
        } catch(PDOException $e) {
            error_log("Error reading organization by adviser: " . $e->getMessage());
            return false;
        }
    }

    public function getAllOrganizationsByAdviserId($adviser_id) {
        if (!$this->conn) {
            error_log("Database connection is null");
            return false;
        }

        $query = "SELECT o.id, o.org_code, o.name, o.description, o.adviser_id, o.status, o.updated_at, o.created_at
                  FROM " . $this->organizations_table . " o
                  WHERE o.adviser_id = :adviser_id
                  ORDER BY o.name ASC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':adviser_id', $adviser_id);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return $results;
        } catch(PDOException $e) {
            error_log("Error reading all organizations by adviser: " . $e->getMessage());
            return false;
        }
    }

    public function setCurrentOrganizationForAdviser($adviser_id, $organization_id) {
        $query = "UPDATE advisers 
                  SET current_organization_id = :current_organization_id
                  WHERE id = :adviser_id";

        try {
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':current_organization_id', $organization_id);
            $stmt->bindParam(':adviser_id', $adviser_id);
            
            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error setting current organization for adviser: " . $e->getMessage());
            return false;
        }
    }

    public function getCurrentOrganizationForAdviser($adviser_id) {
        if (!$this->conn) {
            error_log("Database connection is null");
            return false;
        }

        $query = "SELECT o.id, o.org_code, o.name, o.description, o.adviser_id, o.status, o.updated_at, o.created_at
                  FROM " . $this->organizations_table . " o
                  INNER JOIN advisers a ON a.current_organization_id = o.id
                  WHERE a.id = :adviser_id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':adviser_id', $adviser_id);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                return $result;
            }

            $fallbackQuery = "SELECT o.id, o.org_code, o.name, o.description, o.adviser_id, o.status, o.updated_at, o.created_at
                              FROM " . $this->organizations_table . " o
                              WHERE o.adviser_id = :adviser_id
                              ORDER BY o.id ASC
                              LIMIT 1";
            $stmtFallback = $this->conn->prepare($fallbackQuery);
            $stmtFallback->bindParam(':adviser_id', $adviser_id);
            $stmtFallback->execute();
            $fallbackResult = $stmtFallback->fetch(PDO::FETCH_ASSOC);

            if ($fallbackResult) {
                $this->setCurrentOrganizationForAdviser($adviser_id, $fallbackResult['id']);
                return $fallbackResult;
            }

            return false;
        } catch(PDOException $e) {
            error_log("Error reading current organization for adviser: " . $e->getMessage());
            return false;
        }
    }

    public function updateOrganization($adviser_id, $data) {

        $currentOrg = $this->getOrganizationByAdviserId($adviser_id);
        if (!$currentOrg) {
            error_log("No organization found for adviser_id: " . $adviser_id);
            return false;
        }

        if ($currentOrg['org_code'] !== $data['org_code']) {
            $checkQuery = "SELECT id FROM " . $this->organizations_table . " 
                          WHERE org_code = :org_code AND id != :current_org_id";
            
            try {
                $checkStmt = $this->conn->prepare($checkQuery);
                $checkStmt->bindParam(':org_code', $data['org_code']);
                $checkStmt->bindParam(':current_org_id', $currentOrg['id']);
                $checkStmt->execute();
                
                if ($checkStmt->fetch()) {
                    error_log("Organization code already exists: " . $data['org_code']);
                    return false;
                }
            } catch(PDOException $e) {
                error_log("Error checking organization code: " . $e->getMessage());
                return false;
            }
        }

        $query = "UPDATE " . $this->organizations_table . " 
                  SET org_code = :org_code, 
                      name = :name, 
                      description = :description,
                      status = :status
                  WHERE id = :org_id";

        try {
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':org_code', $data['org_code']);
            $stmt->bindParam(':name', $data['name']);
            $stmt->bindParam(':description', $data['description']);
            $stmt->bindParam(':status', $data['status']);
            $stmt->bindParam(':org_id', $currentOrg['id']);
            
            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error updating organization: " . $e->getMessage());
            return false;
        }
    }

    public function getMembershipsByOrganizationId($organization_id) {
        if (!$this->conn) {
            error_log("Database connection is null");
            return false;
        }

        $query = "SELECT om.id, om.organization_id, om.student_id, om.date_joined, om.role_id, om.membership_status, om.updated_at, om.created_at,
                         s.first_name, s.last_name, s.student_number, s.profile_photo,
                         o.name as organization_name,
                         r.role_name
                  FROM " . $this->memberships_table . " om
                  LEFT JOIN students s ON om.student_id = s.id
                  LEFT JOIN organizations o ON om.organization_id = o.id
                  LEFT JOIN roles r ON om.role_id = r.id
                  WHERE om.organization_id = :organization_id
                  ORDER BY om.created_at DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':organization_id', $organization_id);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($results as &$membership) {
                $membership['student_name'] = $membership['first_name'] . ' ' . $membership['last_name'];
            }

            return $results;
        } catch(PDOException $e) {
            error_log("Error reading organization memberships: " . $e->getMessage());
            return false;
        }
    }

    public function createMembership($data) {
        $query = "INSERT INTO " . $this->memberships_table . "
                  (organization_id, student_id, date_joined, role_id, membership_status)
                  VALUES (:organization_id, :student_id, :date_joined, :role_id, :membership_status)";

        try {
            $stmt = $this->conn->prepare($query);

            $stmt->bindParam(':organization_id', $data['organization_id']);
            $stmt->bindParam(':student_id', $data['student_id']);
            $stmt->bindParam(':date_joined', $data['date_joined']);
            $stmt->bindParam(':role_id', $data['role_id']);
            $stmt->bindParam(':membership_status', $data['membership_status']);

            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error creating organization membership: " . $e->getMessage());
            return false;
        }
    }

    public function updateMembership($id, $data) {
        $query = "UPDATE " . $this->memberships_table . "
                  SET organization_id = :organization_id,
                      student_id = :student_id,
                      date_joined = :date_joined,
                      role_id = :role_id,
                      membership_status = :membership_status
                  WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);

            $stmt->bindParam(':organization_id', $data['organization_id']);
            $stmt->bindParam(':student_id', $data['student_id']);
            $stmt->bindParam(':date_joined', $data['date_joined']);
            $stmt->bindParam(':role_id', $data['role_id']);
            $stmt->bindParam(':membership_status', $data['membership_status']);
            $stmt->bindParam(':id', $id);

            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error updating organization membership: " . $e->getMessage());
            return false;
        }
    }

    public function deleteMembership($id) {
        $query = "DELETE FROM " . $this->memberships_table . " WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            
            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error deleting organization membership: " . $e->getMessage());
            return false;
        }
    }
}
