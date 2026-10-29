<?php

require_once __DIR__ . '/../services/EmailService.php';

class StudentEmail {
    private $emailService;

    public function __construct() {
        $this->emailService = new EmailService();
    }

    public function sendCredentials($to, $firstName, $lastName, $username, $password) {
        $subject = 'Your Student Account Credentials';
        
        $message = $this->buildCredentialsTemplate($firstName, $lastName, $username, $password);
        
        return $this->emailService->send($to, $subject, $message, true);
    }

    public function sendDeletionNotice($to, $firstName, $lastName, $adminName, $reason = 'No reason provided') {
        $subject = 'Your Student Account Has Been Deleted';
        
        $message = $this->buildDeletionTemplate($firstName, $lastName, $adminName, $reason);
        
        return $this->emailService->send($to, $subject, $message, true);
    }

    public function sendOtp($to, $firstName, $otpCode) {
        $subject = 'Your Password Reset OTP Code';
        
        $message = $this->buildOtpTemplate($firstName, $otpCode);
        
        return $this->emailService->send($to, $subject, $message, true);
    }

    private function buildCredentialsTemplate($firstName, $lastName, $username, $password) {
        return "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <title>Your Account Credentials</title>
</head>
<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
        <div style='background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;'>
            <h1 style='color: white; margin: 0; font-size: 24px;'>Student Organization Tracker</h1>
        </div>
        
        <div style='background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;'>
            <h2 style='color: #1f2937; margin-top: 0;'>Welcome, {$firstName} {$lastName}!</h2>
            
            <p style='color: #4b5563;'>Your student account has been successfully created. Here are your login credentials:</p>
            
            <div style='background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 20px 0;'>
                <p style='margin: 10px 0;'><strong>Username:</strong> <span style='color: #1e40af;'>{$username}</span></p>
                <p style='margin: 10px 0;'><strong>Password:</strong> <span style='color: #1e40af;'>{$password}</span></p>
            </div>
            
            <div style='background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;'>
                <p style='margin: 0; color: #92400e;'><strong>Security Notice:</strong> Please change your password after your first login for security purposes.</p>
            </div>
            
            <p style='color: #4b5563;'>If you have any questions, please contact support.</p>
            
            <div style='text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;'>
                <p style='color: #6b7280; font-size: 12px; margin: 0;'>This is an automated email. Please do not reply.</p>
            </div>
        </div>
    </div>
</body>
</html>";
    }

    private function buildDeletionTemplate($firstName, $lastName, $adminName, $reason) {
        return "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <title>Account Deletion Notice</title>
</head>
<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
        <div style='background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;'>
            <h1 style='color: white; margin: 0; font-size: 24px;'>Student Organization Tracker</h1>
        </div>
        
        <div style='background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;'>
            <h2 style='color: #1f2937; margin-top: 0;'>Account Deletion Notice</h2>
            
            <p style='color: #4b5563;'>Dear {$firstName} {$lastName},</p>
            
            <p style='color: #4b5563;'>We regret to inform you that your student account has been deleted from the Student Organization Tracker system.</p>
            
            <div style='background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;'>
                <p style='margin: 0; color: #991b1b;'><strong>Action taken by:</strong> {$adminName}</p>
                <p style='margin: 10px 0 0 0; color: #991b1b;'><strong>Reason:</strong> {$reason}</p>
            </div>
            
            <p style='color: #4b5563;'>If you believe this is an error or have any questions, please contact the system administrator.</p>
            
            <div style='text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;'>
                <p style='color: #6b7280; font-size: 12px; margin: 0;'>This is an automated email. Please do not reply.</p>
            </div>
        </div>
    </div>
</body>
</html>";
    }

    private function buildOtpTemplate($firstName, $otpCode) {
        return "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <title>Password Reset OTP</title>
</head>
<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
        <div style='background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;'>
            <h1 style='color: white; margin: 0; font-size: 24px;'>Student Organization Tracker</h1>
        </div>
        
        <div style='background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;'>
            <h2 style='color: #1f2937; margin-top: 0;'>Password Reset Request</h2>
            
            <p style='color: #4b5563;'>Dear {$firstName},</p>
            
            <p style='color: #4b5563;'>You have requested to reset your password. Use the following One-Time Password (OTP) to proceed:</p>
            
            <div style='background: white; border: 2px solid #1e40af; border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;'>
                <p style='margin: 0; font-size: 36px; font-weight: bold; color: #1e40af; letter-spacing: 8px;'>{$otpCode}</p>
            </div>
            
            <div style='background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;'>
                <p style='margin: 0; color: #92400e;'><strong>Important:</strong> This OTP will expire in 10 minutes. Do not share this code with anyone.</p>
            </div>
            
            <p style='color: #4b5563;'>If you did not request this password reset, please ignore this email or contact support immediately.</p>
            
            <div style='text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;'>
                <p style='color: #6b7280; font-size: 12px; margin: 0;'>This is an automated email. Please do not reply.</p>
            </div>
        </div>
    </div>
</body>
</html>";
    }
}
