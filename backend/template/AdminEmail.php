<?php

require_once __DIR__ . '/../services/EmailService.php';

class AdminEmail {
    private $emailService;

    public function __construct() {
        $this->emailService = new EmailService();
    }

    public function sendCredentials($to, $name, $username, $password, $role = null) {
        $subject = 'Your Admin Account Credentials';
        
        $message = $this->buildCredentialsTemplate($name, $username, $password, $role);
        
        return $this->emailService->send($to, $subject, $message, true);
    }

    public function sendDeletionNotice($to, $name, $adminName, $reason = 'No reason provided') {
        $subject = 'Your Admin Account Has Been Deleted';
        
        $message = $this->buildDeletionTemplate($name, $adminName, $reason);
        
        return $this->emailService->send($to, $subject, $message, true);
    }

    public function sendOtp($to, $name, $otpCode) {
        $subject = 'Your Password Reset OTP Code';
        
        $message = $this->buildOtpTemplate($name, $otpCode);
        
        return $this->emailService->send($to, $subject, $message, true);
    }

    public function sendRoleAssignment($to, $name, $role) {
        $subject = 'Your Admin Role Has Been Assigned';
        
        $message = $this->buildRoleTemplate($name, $role);
        
        return $this->emailService->send($to, $subject, $message, true);
    }

    public function sendStatusChange($to, $name, $status) {
        $subject = 'Your Admin Account Status Has Changed';
        
        $message = $this->buildStatusTemplate($name, $status);
        
        return $this->emailService->send($to, $subject, $message, true);
    }

    public function sendRoleAndStatusChange($to, $name, $role, $status) {
        $subject = 'Your Admin Account Role and Status Have Changed';
        
        $message = $this->buildRoleAndStatusTemplate($name, $role, $status);
        
        return $this->emailService->send($to, $subject, $message, true);
    }

    private function buildCredentialsTemplate($name, $username, $password, $role = null) {
        $roleDisplay = $role === 'super_admin' ? 'Super Admin' : 'Admin';
        $permissions = '';
        
        if ($role) {
            $permissions = $role === 'super_admin' 
                ? '<div style="background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #1f2937; margin-top: 0; font-size: 16px;">Your Role: ' . $roleDisplay . '</h3>
                    <h4 style="color: #4b5563; margin: 15px 0 10px 0; font-size: 14px;">Your Permissions:</h4>
                    <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                        <li>Full access to all system features</li>
                        <li>Manage Advisers, Students, Organizations, Events</li>
                        <li>Manage Event Registrations and Organization Memberships</li>
                        <li>Full access to Audit Logs</li>
                        <li>Manage Admin accounts and roles</li>
                    </ul>
                </div>'
                : '<div style="background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #1f2937; margin-top: 0; font-size: 16px;">Your Role: ' . $roleDisplay . '</h3>
                    <h4 style="color: #4b5563; margin: 15px 0 10px 0; font-size: 14px;">Your Permissions:</h4>
                    <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                        <li>Manage Advisers</li>
                        <li>Manage Students</li>
                        <li>Manage Organizations</li>
                        <li>Manage Events</li>
                        <li>Manage Event Registrations</li>
                        <li>Manage Organization Memberships</li>
                        <li>Limited access to Audit Logs</li>
                    </ul>
                </div>';
        }
        
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
            <h2 style='color: #1f2937; margin-top: 0;'>Welcome, {$name}!</h2>
            
            <p style='color: #4b5563;'>Your admin account has been successfully created. Here are your login credentials:</p>
            
            <div style='background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 20px 0;'>
                <p style='margin: 10px 0;'><strong>Username:</strong> <span style='color: #1e40af;'>{$username}</span></p>
                <p style='margin: 10px 0;'><strong>Password:</strong> <span style='color: #1e40af;'>{$password}</span></p>
            </div>
            
            {$permissions}
            
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

    private function buildDeletionTemplate($name, $adminName, $reason) {
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
            
            <p style='color: #4b5563;'>Dear {$name},</p>
            
            <p style='color: #4b5563;'>We regret to inform you that your admin account has been deleted from the Student Organization Tracker system.</p>
            
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

    private function buildOtpTemplate($name, $otpCode) {
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
            
            <p style='color: #4b5563;'>Dear {$name},</p>
            
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

    private function buildRoleTemplate($name, $role) {
        $roleDisplay = $role === 'super_admin' ? 'Super Admin' : 'Admin';
        $permissions = $role === 'super_admin' 
            ? '<ul style="margin: 15px 0; padding-left: 20px; color: #4b5563;">
                <li>Full access to all system features</li>
                <li>Manage Advisers, Students, Organizations, Events</li>
                <li>Manage Event Registrations and Organization Memberships</li>
                <li>Full access to Audit Logs</li>
                <li>Manage Admin accounts and roles</li>
               </ul>'
            : '<ul style="margin: 15px 0; padding-left: 20px; color: #4b5563;">
                <li>Manage Advisers</li>
                <li>Manage Students</li>
                <li>Manage Organizations</li>
                <li>Manage Events</li>
                <li>Manage Event Registrations</li>
                <li>Manage Organization Memberships</li>
                <li>Limited access to Audit Logs</li>
               </ul>';

        return "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <title>Role Assignment</title>
</head>
<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
        <div style='background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;'>
            <h1 style='color: white; margin: 0; font-size: 24px;'>Student Organization Tracker</h1>
        </div>
        
        <div style='background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;'>
            <h2 style='color: #1f2937; margin-top: 0;'>Role Assignment</h2>
            
            <p style='color: #4b5563;'>Dear {$name},</p>
            
            <p style='color: #4b5563;'>You have been assigned the role of <strong>{$roleDisplay}</strong> in the Student Organization Tracker system.</p>
            
            <div style='background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 20px 0;'>
                <h3 style='color: #1f2937; margin-top: 0; font-size: 16px;'>Your Permissions:</h3>
                {$permissions}
            </div>
            
            <p style='color: #4b5563;'>If you have any questions about your role or permissions, please contact your system administrator.</p>
            
            <div style='text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;'>
                <p style='color: #6b7280; font-size: 12px; margin: 0;'>This is an automated email. Please do not reply.</p>
            </div>
        </div>
    </div>
</body>
</html>";
    }

    private function buildStatusTemplate($name, $status) {
        $statusDisplay = ucfirst($status);
        $statusColor = $status === 'active' ? '#10b981' : '#ef4444';
        $message = $status === 'active' 
            ? 'Your admin account has been set to <strong>Active</strong>. You can now log in to the system.'
            : 'Your admin account has been set to <strong>Inactive</strong>. You will not be able to log in to the system until your account is reactivated.';

        return "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <title>Account Status Change</title>
</head>
<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
        <div style='background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;'>
            <h1 style='color: white; margin: 0; font-size: 24px;'>Student Organization Tracker</h1>
        </div>
        
        <div style='background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;'>
            <h2 style='color: #1f2937; margin-top: 0;'>Account Status Change</h2>
            
            <p style='color: #4b5563;'>Dear {$name},</p>
            
            <div style='background: white; border: 2px solid {$statusColor}; border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;'>
                <p style='margin: 0; font-size: 24px; font-weight: bold; color: {$statusColor};'>{$statusDisplay}</p>
            </div>
            
            <p style='color: #4b5563;'>{$message}</p>
            
            <div style='background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;'>
                <p style='margin: 0; color: #92400e;'><strong>Note:</strong> If you believe this is an error or have any questions, please contact your system administrator immediately.</p>
            </div>
            
            <div style='text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;'>
                <p style='color: #6b7280; font-size: 12px; margin: 0;'>This is an automated email. Please do not reply.</p>
            </div>
        </div>
    </div>
</body>
</html>";
    }

    private function buildRoleAndStatusTemplate($name, $role, $status) {
        $roleDisplay = $role === 'super_admin' ? 'Super Admin' : 'Admin';
        $statusDisplay = ucfirst($status);
        $statusColor = $status === 'active' ? '#10b981' : '#ef4444';
        $statusMessage = $status === 'active' 
            ? 'Your account is now <strong>Active</strong> and you can log in to the system.'
            : 'Your account is now <strong>Inactive</strong> and you will not be able to log in until reactivated.';
        
        $permissions = $role === 'super_admin' 
            ? '<ul style="margin: 15px 0; padding-left: 20px; color: #4b5563;">
                <li>Full access to all system features</li>
                <li>Manage Advisers, Students, Organizations, Events</li>
                <li>Manage Event Registrations and Organization Memberships</li>
                <li>Full access to Audit Logs</li>
                <li>Manage Admin accounts and roles</li>
               </ul>'
            : '<ul style="margin: 15px 0; padding-left: 20px; color: #4b5563;">
                <li>Manage Advisers</li>
                <li>Manage Students</li>
                <li>Manage Organizations</li>
                <li>Manage Events</li>
                <li>Manage Event Registrations</li>
                <li>Manage Organization Memberships</li>
                <li>Limited access to Audit Logs</li>
               </ul>';

        return "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <title>Role and Status Change</title>
</head>
<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
        <div style='background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;'>
            <h1 style='color: white; margin: 0; font-size: 24px;'>Student Organization Tracker</h1>
        </div>
        
        <div style='background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;'>
            <h2 style='color: #1f2937; margin-top: 0;'>Role and Status Change</h2>
            
            <p style='color: #4b5563;'>Dear {$name},</p>
            
            <p style='color: #4b5563;'>Your admin account has been updated with the following changes:</p>
            
            <div style='background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 20px 0;'>
                <h3 style='color: #1f2937; margin-top: 0; font-size: 16px;'>Your Role: {$roleDisplay}</h3>
                <h4 style='color: #4b5563; margin: 15px 0 10px 0; font-size: 14px;'>Your Permissions:</h4>
                {$permissions}
            </div>
            
            <div style='background: white; border: 2px solid {$statusColor}; border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;'>
                <p style='margin: 0; font-size: 24px; font-weight: bold; color: {$statusColor};'>Status: {$statusDisplay}</p>
            </div>
            
            <p style='color: #4b5563;'>{$statusMessage}</p>
            
            <div style='background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;'>
                <p style='margin: 0; color: #92400e;'><strong>Note:</strong> If you believe this is an error or have any questions, please contact your system administrator immediately.</p>
            </div>
            
            <div style='text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;'>
                <p style='color: #6b7280; font-size: 12px; margin: 0;'>This is an automated email. Please do not reply.</p>
            </div>
        </div>
    </div>
</body>
</html>";
    }
}
