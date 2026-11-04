<?php

require_once __DIR__ . '/../../config/db.php';

class ContactsModel {
    private $conn;
    private $table_name = "ban_appeals";

    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
    }

    public function createAppeal($data) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (name, email, ip_address, subject, reason, status, created_at) 
                  VALUES (:name, :email, :ip_address, :subject, :reason, 'pending', NOW())";

        try {
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':name', $data['name']);
            $stmt->bindParam(':email', $data['email']);
            $stmt->bindParam(':ip_address', $data['ip_address']);
            $stmt->bindParam(':subject', $data['subject']);
            $stmt->bindParam(':reason', $data['reason']);
            
            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error creating appeal: " . $e->getMessage());
            return false;
        }
    }

    public function getAppealById($id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            error_log("Error getting appeal: " . $e->getMessage());
            return false;
        }
    }

    public function getAllAppeals() {
        $query = "SELECT a.*, 
                  (SELECT COUNT(*) FROM appeal_email_history WHERE appeal_id = a.id) as email_count
                  FROM " . $this->table_name . " a 
                  ORDER BY created_at DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            error_log("Error getting all appeals: " . $e->getMessage());
            return false;
        }
    }

    public function updateAppealStatus($id, $status) {
        $query = "UPDATE " . $this->table_name . "
                  SET status = :status, updated_at = NOW()
                  WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':status', $status);

            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error updating appeal status: " . $e->getMessage());
            return false;
        }
    }

    public function addEmailHistory($appealId, $sentTo, $subject, $message) {
        $query = "INSERT INTO appeal_email_history 
                  (appeal_id, sent_to, subject, message, sent_at) 
                  VALUES (:appeal_id, :sent_to, :subject, :message, NOW())";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':appeal_id', $appealId);
            $stmt->bindParam(':sent_to', $sentTo);
            $stmt->bindParam(':subject', $subject);
            $stmt->bindParam(':message', $message);

            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error adding email history: " . $e->getMessage());
            return false;
        }
    }

    public function getEmailHistory($appealId) {
        $query = "SELECT * FROM appeal_email_history 
                  WHERE appeal_id = :appeal_id 
                  ORDER BY sent_at DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':appeal_id', $appealId);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            error_log("Error getting email history: " . $e->getMessage());
            return false;
        }
    }

    public function getAppealWithEmailHistory($id) {
        $query = "SELECT a.*, 
                  (SELECT COUNT(*) FROM appeal_email_history WHERE appeal_id = a.id) as email_count
                  FROM " . $this->table_name . " a 
                  WHERE a.id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $appeal = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($appeal) {
                $appeal['email_history'] = $this->getEmailHistory($id);
            }
            
            return $appeal;
        } catch(PDOException $e) {
            error_log("Error getting appeal with email history: " . $e->getMessage());
            return false;
        }
    }

    public function createContact($data) {
        $query = "INSERT INTO support_contacts 
                  (name, email, subject, message, status, created_at) 
                  VALUES (:name, :email, :subject, :message, 'pending', NOW())";

        try {
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':name', $data['name']);
            $stmt->bindParam(':email', $data['email']);
            $stmt->bindParam(':subject', $data['subject']);
            $stmt->bindParam(':message', $data['message']);
            
            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error creating contact: " . $e->getMessage());
            return false;
        }
    }

    public function createReport($data, $reportId) {
        $query = "INSERT INTO support_reports 
                  (report_id, name, email, subject, link, console_log, description, images, status, created_at) 
                  VALUES (:report_id, :name, :email, :subject, :link, :console_log, :description, :images, 'pending', NOW())";

        try {
            $stmt = $this->conn->prepare($query);
            
            $imagesJson = isset($data['images']) ? json_encode($data['images']) : null;
            $consoleLog = isset($data['console_log']) ? $data['console_log'] : null;
            
            $stmt->bindParam(':report_id', $reportId);
            $stmt->bindParam(':name', $data['name']);
            $stmt->bindParam(':email', $data['email']);
            $stmt->bindParam(':subject', $data['subject']);
            $stmt->bindParam(':link', $data['link']);
            $stmt->bindParam(':console_log', $consoleLog);
            $stmt->bindParam(':description', $data['description']);
            $stmt->bindParam(':images', $imagesJson);
            
            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error creating report: " . $e->getMessage());
            return false;
        }
    }


    public function getContactById($id) {
        $query = "SELECT * FROM support_contacts WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            error_log("Error getting contact: " . $e->getMessage());
            return false;
        }
    }

    public function getAllContacts() {
        $query = "SELECT c.*, 
                  (SELECT COUNT(*) FROM support_contact_email_history WHERE contact_id = c.id) as email_count
                  FROM support_contacts c 
                  ORDER BY created_at DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            error_log("Error getting all contacts: " . $e->getMessage());
            return false;
        }
    }

    public function updateContactStatus($id, $status) {
        $query = "UPDATE support_contacts
                  SET status = :status, updated_at = NOW()
                  WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':status', $status);

            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error updating contact status: " . $e->getMessage());
            return false;
        }
    }

    public function addContactEmailHistory($contactId, $sentTo, $subject, $message) {
        $query = "INSERT INTO support_contact_email_history 
                  (contact_id, sent_to, subject, message, sent_at) 
                  VALUES (:contact_id, :sent_to, :subject, :message, NOW())";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':contact_id', $contactId);
            $stmt->bindParam(':sent_to', $sentTo);
            $stmt->bindParam(':subject', $subject);
            $stmt->bindParam(':message', $message);

            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error adding contact email history: " . $e->getMessage());
            return false;
        }
    }

    public function getContactEmailHistory($contactId) {
        $query = "SELECT * FROM support_contact_email_history 
                  WHERE contact_id = :contact_id 
                  ORDER BY sent_at DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':contact_id', $contactId);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            error_log("Error getting contact email history: " . $e->getMessage());
            return false;
        }
    }

    public function getContactWithEmailHistory($id) {
        $query = "SELECT c.*, 
                  (SELECT COUNT(*) FROM support_contact_email_history WHERE contact_id = c.id) as email_count
                  FROM support_contacts c 
                  WHERE c.id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $contact = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($contact) {
                $contact['email_history'] = $this->getContactEmailHistory($id);
            }
            
            return $contact;
        } catch(PDOException $e) {
            error_log("Error getting contact with email history: " . $e->getMessage());
            return false;
        }
    }

    public function getReportById($id) {
        $query = "SELECT * FROM support_reports WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            error_log("Error getting report: " . $e->getMessage());
            return false;
        }
    }

    public function getAllReports() {
        $query = "SELECT r.*, 
                  (SELECT COUNT(*) FROM support_report_email_history WHERE report_id = r.id) as email_count
                  FROM support_reports r 
                  ORDER BY created_at DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            error_log("Error getting all reports: " . $e->getMessage());
            return false;
        }
    }

    public function updateReportStatus($id, $status) {
        $query = "UPDATE support_reports
                  SET status = :status, updated_at = NOW()
                  WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':status', $status);

            if($stmt->execute()) {
                return true;
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error updating report status: " . $e->getMessage());
            return false;
        }
    }

    public function addReportEmailHistory($reportId, $sentTo, $subject, $message) {
        $query = "INSERT INTO support_report_email_history 
                  (report_id, sent_to, subject, message, sent_at) 
                  VALUES (:report_id, :sent_to, :subject, :message, NOW())";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':report_id', $reportId);
            $stmt->bindParam(':sent_to', $sentTo);
            $stmt->bindParam(':subject', $subject);
            $stmt->bindParam(':message', $message);

            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error adding report email history: " . $e->getMessage());
            return false;
        }
    }

    public function getReportEmailHistory($reportId) {
        $query = "SELECT * FROM support_report_email_history 
                  WHERE report_id = :report_id 
                  ORDER BY sent_at DESC";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':report_id', $reportId);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            error_log("Error getting report email history: " . $e->getMessage());
            return false;
        }
    }

    public function getReportWithEmailHistory($id) {
        $query = "SELECT r.*, 
                  (SELECT COUNT(*) FROM support_report_email_history WHERE report_id = r.id) as email_count
                  FROM support_reports r 
                  WHERE r.id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $report = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($report) {
                $report['email_history'] = $this->getReportEmailHistory($id);
            }
            
            return $report;
        } catch(PDOException $e) {
            error_log("Error getting report with email history: " . $e->getMessage());
            return false;
        }
    }
}