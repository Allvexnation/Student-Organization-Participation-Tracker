<?php

require_once __DIR__ . '/../services/EmailService.php';

class ContactsEmail {
    private $emailService;

    public function __construct() {
        $this->emailService = new EmailService();
    }

    public function sendUserConfirmation($to, $name, $subject, $appealId) {
        $emailSubject = 'Ban Appeal Received - Confirmation';
        
        $message = $this->buildUserConfirmationTemplate($name, $subject, $appealId);
        
        return $this->emailService->send($to, $emailSubject, $message, true);
    }

    public function sendAdminNotification($data) {

        $mailerConnection = getenv('MAILER_CONNECTION') ?: 'Development';
        
        if ($mailerConnection === 'Development') {
            $adminEmail = getenv('DEV_SMTP_FROM_EMAIL');
        } else {
            $adminEmail = getenv('PROD_SMTP_FROM_EMAIL');
        }
        
        if (!$adminEmail) {
            error_log('No SMTP_FROM_EMAIL configured for ' .($mailerConnection ?: 'Development'). ' environment');
            return false;
        }
        
        $emailSubject = 'New Ban Appeal Submitted - #' . ($data['appeal_id'] ?? 'Pending');
        
        $message = $this->buildAdminNotificationTemplate($data);
        
        return $this->emailService->send($adminEmail, $emailSubject, $message, true);
    }

    public function sendReplyEmail($to, $name, $replyMessage, $appealId, $status) {
        $emailSubject = 'Response to Your Ban Appeal - #' . $appealId;
        
        $message = $this->buildReplyTemplate($name, $replyMessage, $appealId, $status);
        
        return $this->emailService->send($to, $emailSubject, $message, true);
    }

    public function sendContactUserConfirmation($to, $name, $subject, $contactId) {
        $emailSubject = 'Contact Message Received - Confirmation';
        
        $message = $this->buildContactUserConfirmationTemplate($name, $subject, $contactId);
        
        return $this->emailService->send($to, $emailSubject, $message, true);
    }

    public function sendContactAdminNotification($data) {
        $mailerConnection = getenv('MAILER_CONNECTION') ?: 'Development';
        
        if ($mailerConnection === 'Development') {
            $adminEmail = getenv('DEV_SMTP_FROM_EMAIL');
        } else {
            $adminEmail = getenv('PROD_SMTP_FROM_EMAIL');
        }
        
        if (!$adminEmail) {
            error_log('No SMTP_FROM_EMAIL configured for ' .($mailerConnection ?: 'Development'). ' environment');
            return false;
        }
        
        $emailSubject = 'New Contact Message Submitted - #' . ($data['contact_id'] ?? 'Pending');
        
        $message = $this->buildContactAdminNotificationTemplate($data);
        
        return $this->emailService->send($adminEmail, $emailSubject, $message, true);
    }

    public function sendContactReplyEmail($to, $name, $replyMessage, $contactId, $status) {
        $emailSubject = 'Response to Your Contact Inquiry - #' . $contactId;
        
        $message = $this->buildContactReplyTemplate($name, $replyMessage, $contactId, $status);
        
        return $this->emailService->send($to, $emailSubject, $message, true);
    }

    public function sendReportReplyEmail($to, $name, $replyMessage, $reportId, $status) {
        $emailSubject = 'Response to Your Problem Report - ' . $reportId;
        
        $message = $this->buildReportReplyTemplate($name, $replyMessage, $reportId, $status);
        
        return $this->emailService->send($to, $emailSubject, $message, true);
    }

    public function sendReportUserConfirmation($to, $name, $subject, $reportId) {
        $emailSubject = 'Problem Report Received - Confirmation';
        
        $message = $this->buildReportUserConfirmationTemplate($name, $subject, $reportId);
        
        return $this->emailService->send($to, $emailSubject, $message, true);
    }

    public function sendReportAdminNotification($data, $reportId) {

        $mailerConnection = getenv('MAILER_CONNECTION') ?: 'Development';
        
        if ($mailerConnection === 'Development') {
            $adminEmail = getenv('DEV_SMTP_FROM_EMAIL');
        } else {
            $adminEmail = getenv('PROD_SMTP_FROM_EMAIL');
        }
        
        if (!$adminEmail) {
            error_log('No SMTP_FROM_EMAIL configured for ' .($mailerConnection ?: 'Development'). ' environment');
            return false;
        }
        
        $emailSubject = 'New Problem Report Submitted - ' . $reportId;
        
        $message = $this->buildReportAdminNotificationTemplate($data, $reportId);
        
        return $this->emailService->send($adminEmail, $emailSubject, $message, true);
    }

    private function buildUserConfirmationTemplate($name, $subject, $appealId) {
        return "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <title>Ban Appeal Received</title>
</head>
<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
        <div style='background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;'>
            <h1 style='color: white; margin: 0; font-size: 24px;'>Student Organization Tracker</h1>
        </div>
        
        <div style='background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;'>
            <h2 style='color: #1f2937; margin-top: 0;'>Ban Appeal Received</h2>
            
            <p style='color: #4b5563;'>Dear {$name},</p>
            
            <p style='color: #4b5563;'>Thank you for submitting your ban appeal. We have received your request and it is currently under review.</p>
            
            <div style='background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 20px 0;'>
                <h3 style='color: #1f2937; margin-top: 0; font-size: 16px;'>Appeal Details:</h3>
                <p style='margin: 10px 0;'><strong>Appeal ID:</strong> <span style='color: #1e40af;'>#{$appealId}</span></p>
                <p style='margin: 10px 0;'><strong>Subject:</strong> {$subject}</p>
                <p style='margin: 10px 0;'><strong>Status:</strong> <span style='color: #f59e0b; font-weight: bold;'>Pending Review</span></p>
            </div>
            
            <p style='color: #4b5563;'>Our team will review your appeal within 24-48 hours. You will receive another email once a decision has been made.</p>
            
            <div style='background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;'>
                <p style='margin: 0; color: #1e40af;'><strong>Note:</strong> Please keep this email for your records. You may need to reference your Appeal ID in future communications.</p>
            </div>
            
            <p style='color: #4b5563;'>If you have any questions or need to provide additional information, please contact our support team.</p>
            
            <div style='text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;'>
                <p style='color: #6b7280; font-size: 12px; margin: 0;'>This is an automated email. Please do not reply.</p>
            </div>
        </div>
    </div>
</body>
</html>";
    }

    private function buildAdminNotificationTemplate($data) {
        return "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <title>New Ban Appeal</title>
</head>
<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
        <div style='background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;'>
            <h1 style='color: white; margin: 0; font-size: 24px;'>Student Organization Tracker</h1>
        </div>
        
        <div style='background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;'>
            <h2 style='color: #1f2937; margin-top: 0;'>New Ban Appeal Submitted</h2>
            
            <p style='color: #4b5563;'>A new ban appeal has been submitted and requires review.</p>
            
            <div style='background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 20px 0;'>
                <h3 style='color: #1f2937; margin-top: 0; font-size: 16px;'>Appellant Information:</h3>
                <p style='margin: 10px 0;'><strong>Name:</strong> {$data['name']}</p>
                <p style='margin: 10px 0;'><strong>Email:</strong> {$data['email']}</p>
                <p style='margin: 10px 0;'><strong>IP Address:</strong> {$data['ip_address']}</p>
            </div>
            
            <div style='background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 20px 0;'>
                <h3 style='color: #1f2937; margin-top: 0; font-size: 16px;'>Appeal Details:</h3>
                <p style='margin: 10px 0;'><strong>Subject:</strong> {$data['subject']}</p>
                <p style='margin: 10px 0;'><strong>Reason:</strong></p>
                <div style='background: #f3f4f6; padding: 15px; border-radius: 4px; margin-top: 10px;'>
                    <p style='color: #374151; margin: 0; font-style: italic;'>{$data['reason']}</p>
                </div>
            </div>
            
            <div style='background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;'>
                <p style='margin: 0; color: #92400e;'><strong>Action Required:</strong> Please review this appeal and respond within 24-48 hours.</p>
            </div>
            
            <p style='margin: 10px 0;'><strong>Review Date:</strong> " . date('F j, Y, g:i a') . "</p>
            
            <div style='text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;'>
                <p style='color: #6b7280; font-size: 12px; margin: 0;'>This is an automated email. Please do not reply.</p>
            </div>
        </div>
    </div>
</body>
</html>";
    }

    private function buildReplyTemplate($name, $replyMessage, $appealId, $status) {
        $statusDisplay = ucfirst($status);
        $statusColor = $status === 'resolved' ? '#10b981' : '#f59e0b';
        $statusMessage = $status === 'resolved' 
            ? 'Your ban appeal has been resolved. Please review the response below.'
            : 'Your ban appeal is still under review. Please review the update below.';

        return "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <title>Response to Ban Appeal</title>
</head>
<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
        <div style='background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;'>
            <h1 style='color: white; margin: 0; font-size: 24px;'>Student Organization Tracker</h1>
        </div>
        
        <div style='background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;'>
            <h2 style='color: #1f2937; margin-top: 0;'>Response to Your Ban Appeal</h2>
            
            <p style='color: #4b5563;'>Dear {$name},</p>
            
            <p style='color: #4b5563;'>{$statusMessage}</p>
            
            <div style='background: white; border: 2px solid {$statusColor}; border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;'>
                <p style='margin: 0; font-size: 24px; font-weight: bold; color: {$statusColor};'>Status: {$statusDisplay}</p>
            </div>
            
            <div style='background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 20px 0;'>
                <h3 style='color: #1f2937; margin-top: 0; font-size: 16px;'>Appeal ID: #{$appealId}</h3>
                <h3 style='color: #1f2937; margin: 15px 0 10px 0; font-size: 16px;'>Response:</h3>
                <div style='background: #f3f4f6; padding: 15px; border-radius: 4px; margin-top: 10px;'>
                    <p style='color: #374151; margin: 0;'>{$replyMessage}</p>
                </div>
            </div>
            
            <p style='color: #4b5563;'>If you have any questions or need further assistance, please contact our support team.</p>
            
            <div style='text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;'>
                <p style='color: #6b7280; font-size: 12px; margin: 0;'>This is an automated email. Please do not reply.</p>
            </div>
        </div>
    </div>
</body>
</html>";
    }

    private function buildContactUserConfirmationTemplate($name, $subject, $contactId) {
        return "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <title>Contact Message Received</title>
</head>
<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
        <div style='background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;'>
            <h1 style='color: white; margin: 0; font-size: 24px;'>Student Organization Tracker</h1>
        </div>
        
        <div style='background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;'>
            <h2 style='color: #1f2937; margin-top: 0;'>Contact Message Received</h2>
            
            <p style='color: #4b5563;'>Dear {$name},</p>
            
            <p style='color: #4b5563;'>Thank you for contacting us. We have received your message and will get back to you as soon as possible.</p>
            
            <div style='background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 20px 0;'>
                <h3 style='color: #1f2937; margin-top: 0; font-size: 16px;'>Message Details:</h3>
                <p style='margin: 10px 0;'><strong>Contact ID:</strong> <span style='color: #1e40af;'>#{$contactId}</span></p>
                <p style='margin: 10px 0;'><strong>Subject:</strong> {$subject}</p>
                <p style='margin: 10px 0;'><strong>Status:</strong> <span style='color: #f59e0b; font-weight: bold;'>Pending Review</span></p>
            </div>
            
            <p style='color: #4b5563;'>Our team will review your message within 24-48 hours. You will receive a response once we have addressed your inquiry.</p>
            
            <div style='background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;'>
                <p style='margin: 0; color: #1e40af;'><strong>Note:</strong> Please keep this email for your records. You may need to reference your Contact ID in future communications.</p>
            </div>
            
            <p style='color: #4b5563;'>If you have any urgent matters, please contact our support team directly.</p>
            
            <div style='text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;'>
                <p style='color: #6b7280; font-size: 12px; margin: 0;'>This is an automated email. Please do not reply.</p>
            </div>
        </div>
    </div>
</body>
</html>";
    }

    private function buildContactAdminNotificationTemplate($data) {
        return "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <title>New Contact Message</title>
</head>
<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
        <div style='background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;'>
            <h1 style='color: white; margin: 0; font-size: 24px;'>Student Organization Tracker</h1>
        </div>
        
        <div style='background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;'>
            <h2 style='color: #1f2937; margin-top: 0;'>New Contact Message Submitted</h2>
            
            <p style='color: #4b5563;'>A new contact message has been submitted and requires review.</p>
            
            <div style='background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 20px 0;'>
                <h3 style='color: #1f2937; margin-top: 0; font-size: 16px;'>Sender Information:</h3>
                <p style='margin: 10px 0;'><strong>Name:</strong> {$data['name']}</p>
                <p style='margin: 10px 0;'><strong>Email:</strong> {$data['email']}</p>
            </div>
            
            <div style='background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 20px 0;'>
                <h3 style='color: #1f2937; margin-top: 0; font-size: 16px;'>Message Details:</h3>
                <p style='margin: 10px 0;'><strong>Subject:</strong> {$data['subject']}</p>
                <p style='margin: 10px 0;'><strong>Message:</strong></p>
                <div style='background: #f3f4f6; padding: 15px; border-radius: 4px; margin-top: 10px;'>
                    <p style='color: #374151; margin: 0; font-style: italic;'>{$data['message']}</p>
                </div>
            </div>
            
            <div style='background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;'>
                <p style='margin: 0; color: #92400e;'><strong>Action Required:</strong> Please review this message and respond within 24-48 hours.</p>
            </div>
            
            <p style='margin: 10px 0;'><strong>Received Date:</strong> " . date('F j, Y, g:i a') . "</p>
            
            <div style='text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;'>
                <p style='color: #6b7280; font-size: 12px; margin: 0;'>This is an automated email. Please do not reply.</p>
            </div>
        </div>
    </div>
</body>
</html>";
    }

    private function buildContactReplyTemplate($name, $replyMessage, $contactId, $status) {
        $statusDisplay = ucfirst(str_replace('_', ' ', $status));
        $statusColor = $status === 'resolved' ? '#10b981' : ($status === 'receive' ? '#8b5cf6' : '#f59e0b');
        $statusMessage = $status === 'resolved' 
            ? 'Your inquiry has been resolved. Please review the response below.'
            : ($status === 'receive' 
                ? 'We have received your inquiry and are processing it. Please review the update below.'
                : 'Your inquiry is still under review. Please review the update below.');

        return "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <title>Response to Contact Inquiry</title>
</head>
<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
        <div style='background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;'>
            <h1 style='color: white; margin: 0; font-size: 24px;'>Student Organization Tracker</h1>
        </div>
        
        <div style='background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;'>
            <h2 style='color: #1f2937; margin-top: 0;'>Response to Your Contact Inquiry</h2>
            
            <p style='color: #4b5563;'>Dear {$name},</p>
            
            <p style='color: #4b5563;'>{$statusMessage}</p>
            
            <div style='background: white; border: 2px solid {$statusColor}; border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;'>
                <p style='margin: 0; font-size: 24px; font-weight: bold; color: {$statusColor};'>Status: {$statusDisplay}</p>
            </div>
            
            <div style='background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 20px 0;'>
                <h3 style='color: #1f2937; margin-top: 0; font-size: 16px;'>Contact ID: #{$contactId}</h3>
                <h3 style='color: #1f2937; margin: 15px 0 10px 0; font-size: 16px;'>Response:</h3>
                <div style='background: #f3f4f6; padding: 15px; border-radius: 4px; margin-top: 10px;'>
                    <p style='color: #374151; margin: 0;'>{$replyMessage}</p>
                </div>
            </div>
            
            <p style='color: #4b5563;'>If you have any questions or need further assistance, please contact our support team.</p>
            
            <div style='text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;'>
                <p style='color: #6b7280; font-size: 12px; margin: 0;'>This is an automated email. Please do not reply.</p>
            </div>
        </div>
    </div>
</body>
</html>";
    }

    private function buildReportReplyTemplate($name, $replyMessage, $reportId, $status) {
        $statusDisplay = ucfirst(str_replace('_', ' ', $status));
        $statusColor = $status === 'resolved' ? '#10b981' : ($status === 'receive' ? '#8b5cf6' : '#f59e0b');
        $statusMessage = $status === 'resolved' 
            ? 'Your problem report has been resolved. Please review the response below.'
            : ($status === 'receive' 
                ? 'We have received your problem report and are processing it. Please review the update below.'
                : 'Your problem report is still under review. Please review the update below.');

        return "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <title>Response to Problem Report</title>
</head>
<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
        <div style='background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;'>
            <h1 style='color: white; margin: 0; font-size: 24px;'>Student Organization Tracker</h1>
        </div>
        
        <div style='background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;'>
            <h2 style='color: #1f2937; margin-top: 0;'>Response to Your Problem Report</h2>
            
            <p style='color: #4b5563;'>Dear {$name},</p>
            
            <p style='color: #4b5563;'>{$statusMessage}</p>
            
            <div style='background: white; border: 2px solid {$statusColor}; border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;'>
                <p style='margin: 0; font-size: 24px; font-weight: bold; color: {$statusColor};'>Status: {$statusDisplay}</p>
            </div>
            
            <div style='background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 20px 0;'>
                <h3 style='color: #1f2937; margin-top: 0; font-size: 16px;'>Report ID: {$reportId}</h3>
                <h3 style='color: #1f2937; margin: 15px 0 10px 0; font-size: 16px;'>Response:</h3>
                <div style='background: #f3f4f6; padding: 15px; border-radius: 4px; margin-top: 10px;'>
                    <p style='color: #374151; margin: 0;'>{$replyMessage}</p>
                </div>
            </div>
            
            <p style='color: #4b5563;'>If you have any questions or need further assistance, please contact our support team.</p>
            
            <div style='text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;'>
                <p style='color: #6b7280; font-size: 12px; margin: 0;'>This is an automated email. Please do not reply.</p>
            </div>
        </div>
    </div>
</body>
</html>";
    }

    private function buildReportUserConfirmationTemplate($name, $subject, $reportId) {
        return "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <title>Problem Report Received</title>
</head>
<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
        <div style='background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;'>
            <h1 style='color: white; margin: 0; font-size: 24px;'>Student Organization Tracker</h1>
        </div>
        
        <div style='background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;'>
            <h2 style='color: #1f2937; margin-top: 0;'>Problem Report Received</h2>
            
            <p style='color: #4b5563;'>Dear {$name},</p>
            
            <p style='color: #4b5563;'>Thank you for reporting this issue. We have received your report and our technical team will investigate the problem.</p>
            
            <div style='background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 20px 0;'>
                <h3 style='color: #1f2937; margin-top: 0; font-size: 16px;'>Report Details:</h3>
                <p style='margin: 10px 0;'><strong>Report ID:</strong> <span style='color: #dc2626; font-weight: bold;'>{$reportId}</span></p>
                <p style='margin: 10px 0;'><strong>Category:</strong> {$subject}</p>
                <p style='margin: 10px 0;'><strong>Status:</strong> <span style='color: #f59e0b; font-weight: bold;'>Under Investigation</span></p>
            </div>
            
            <p style='color: #4b5563;'>Our technical team will review your report and work on resolving the issue. We appreciate your help in improving our system.</p>
            
            <div style='background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;'>
                <p style='margin: 0; color: #991b1b;'><strong>Note:</strong> Please keep this email for your records. Your Report ID is {$reportId}.</p>
            </div>
            
            <p style='color: #4b5563;'>If you have additional information about this issue, please include your Report ID in any follow-up communications.</p>
            
            <div style='text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;'>
                <p style='color: #6b7280; font-size: 12px; margin: 0;'>This is an automated email. Please do not reply.</p>
            </div>
        </div>
    </div>
</body>
</html>";
    }

    private function buildReportAdminNotificationTemplate($data, $reportId) {
        $imageCount = isset($data['images']) && is_array($data['images']) ? count($data['images']) : 0;
        
        $message = "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <title>New Problem Report</title>
</head>
<body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
    <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
        <div style='background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;'>
            <h1 style='color: white; margin: 0; font-size: 24px;'>Student Organization Tracker</h1>
        </div>
        
        <div style='background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;'>
            <h2 style='color: #1f2937; margin-top: 0;'>New Problem Report Submitted</h2>
            
            <p style='color: #4b5563;'>A new problem report has been submitted and requires investigation.</p>
            
            <div style='background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 20px 0;'>
                <h3 style='color: #1f2937; margin-top: 0; font-size: 16px;'>Report Information:</h3>
                <p style='margin: 10px 0;'><strong>Report ID:</strong> <span style='color: #dc2626; font-weight: bold;'>{$reportId}</span></p>
                <p style='margin: 10px 0;'><strong>Category:</strong> {$data['subject']}</p>
                <p style='margin: 10px 0;'><strong>Page Link:</strong> <a href='{$data['link']}' style='color: #1e40af;'>{$data['link']}</a></p>
                <p style='margin: 10px 0;'><strong>Images Attached:</strong> {$imageCount}</p>
            </div>
            
            <div style='background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 20px 0;'>
                <h3 style='color: #1f2937; margin-top: 0; font-size: 16px;'>Reporter Information:</h3>
                <p style='margin: 10px 0;'><strong>Name:</strong> {$data['name']}</p>
                <p style='margin: 10px 0;'><strong>Email:</strong> {$data['email']}</p>
            </div>
            
            <div style='background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 20px 0;'>
                <h3 style='color: #1f2937; margin-top: 0; font-size: 16px;'>Issue Description:</h3>
                <div style='background: #f3f4f6; padding: 15px; border-radius: 4px; margin-top: 10px;'>
                    <p style='color: #374151; margin: 0;'>{$data['description']}</p>
                </div>
            </div>";
        
        if (!empty($data['console_log'])) {
            $message .= "
            <div style='background: white; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 20px 0;'>
                <h3 style='color: #1f2937; margin-top: 0; font-size: 16px;'>Console Log:</h3>
                <div style='background: #1f2937; padding: 15px; border-radius: 4px; margin-top: 10px;'>
                    <pre style='color: #10b981; margin: 0; white-space: pre-wrap; font-family: monospace; font-size: 12px;'>{$data['console_log']}</pre>
                </div>
            </div>";
        }
        
        $message .= "
            <div style='background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;'>
                <p style='margin: 0; color: #92400e;'><strong>Action Required:</strong> Please investigate this report and take appropriate action.</p>
            </div>
            
            <p style='margin: 10px 0;'><strong>Reported Date:</strong> " . date('F j, Y, g:i a') . "</p>
            
            <div style='text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;'>
                <p style='color: #6b7280; font-size: 12px; margin: 0;'>This is an automated email. Please do not reply.</p>
            </div>
        </div>
    </div>
</body>
</html>";

        return $message;
    }
}
