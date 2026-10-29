<?php

require_once __DIR__ . '/../config/db.php';

class AdviserOtpModel {
    private $conn;
    private $table_name = "adviser_otps";

    public function __construct() {
        $database = Database::getInstance();
        $this->conn = $database->getConnection();
        if (!$this->conn) {
            error_log("Failed to establish database connection in AdviserOtpModel");
        }
    }

    public function create($adviserId, $otpCode, $expiryMinutes = 10) {
        $expiry = date('Y-m-d H:i:s', strtotime("+$expiryMinutes minutes"));
        
        $query = "INSERT INTO " . $this->table_name . " 
                  (adviser_id, otp_code, expiry) 
                  VALUES (:adviser_id, :otp_code, :expiry)";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':adviser_id', $adviserId);
            $stmt->bindParam(':otp_code', $otpCode);
            $stmt->bindParam(':expiry', $expiry);
            
            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        } catch(PDOException $e) {
            error_log("Error creating OTP: " . $e->getMessage());
            return false;
        }
    }

    public function getLatestOtp($adviserId) {
        $query = "SELECT * FROM " . $this->table_name . " 
                  WHERE adviser_id = :adviser_id 
                  ORDER BY created_at DESC 
                  LIMIT 0,1";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':adviser_id', $adviserId);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            error_log("Error reading OTP: " . $e->getMessage());
            return false;
        }
    }

    public function verifyOtp($adviserId, $otpCode, $maxAttempts = 3) {
        $otp = $this->getLatestOtp($adviserId);
        
        if (!$otp) {
            return ['valid' => false, 'message' => 'OTP not found'];
        }
        
        $expiry = strtotime($otp['expiry']);
        $now = time();
        
        if ($now > $expiry) {
            return ['valid' => false, 'message' => 'OTP expired'];
        }
        
        if ($otp['attempts'] >= $maxAttempts) {
            return ['valid' => false, 'message' => 'Maximum attempts exceeded'];
        }
        
        if ($otp['otp_code'] !== $otpCode) {
            $this->incrementAttempts($otp['id']);
            return ['valid' => false, 'message' => 'Invalid OTP', 'attempts' => $otp['attempts'] + 1];
        }
        
        return ['valid' => true, 'message' => 'OTP verified'];
    }

    public function incrementAttempts($otpId) {
        $query = "UPDATE " . $this->table_name . " 
                  SET attempts = attempts + 1 
                  WHERE id = :id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $otpId);
            return $stmt->execute();
        } catch(PDOException $e) {
            error_log("Error incrementing attempts: " . $e->getMessage());
            return false;
        }
    }

    public function deleteByAdviserId($adviserId) {
        $query = "DELETE FROM " . $this->table_name . " WHERE adviser_id = :adviser_id";

        try {
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':adviser_id', $adviserId);
            return $stmt->execute();
        } catch(PDOException $e) {
            error_log("Error deleting OTP: " . $e->getMessage());
            return false;
        }
    }

    public function deleteExpiredOtps() {
        $query = "DELETE FROM " . $this->table_name . " WHERE expiry < NOW()";

        try {
            $this->conn->exec($query);
            return true;
        } catch(PDOException $e) {
            error_log("Error deleting expired OTPs: " . $e->getMessage());
            return false;
        }
    }
}
