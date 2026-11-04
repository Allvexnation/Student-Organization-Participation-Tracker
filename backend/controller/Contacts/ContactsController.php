<?php

require_once __DIR__ . '/../../model/Contacts/ContactsModel.php';
require_once __DIR__ . '/../../template/ContactsEmail.php';

class ContactsController {
    private $contactsModel;

    public function __construct() {
        $this->contactsModel = new ContactsModel();
    }

    public function submitAppeal() {
        header('Content-Type: application/json');
        
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['name']) || !isset($data['email']) || !isset($data['ip_address']) || 
            !isset($data['subject']) || !isset($data['reason'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid email address']);
            return;
        }

        if (!filter_var($data['ip_address'], FILTER_VALIDATE_IP)) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid IP address']);
            return;
        }

        $appealId = $this->contactsModel->createAppeal($data);
        
        if ($appealId) {
            $emailErrors = [];
 
            $contactsEmail = new ContactsEmail();
            $userEmailSent = $contactsEmail->sendUserConfirmation($data['email'], $data['name'], $data['subject'], $appealId);
            if (!$userEmailSent) {
                $emailErrors[] = 'Failed to send confirmation email to user';
            }

            $adminEmailSent = $contactsEmail->sendAdminNotification($data);
            if (!$adminEmailSent) {
                $emailErrors[] = 'Failed to send notification email to admin';
            }
            
            if (empty($emailErrors)) {
                http_response_code(201);
                echo json_encode([
                    'message' => 'Appeal submitted successfully',
                    'appeal_id' => $appealId
                ]);
            } else {
                http_response_code(201);
                echo json_encode([
                    'message' => 'Appeal submitted successfully',
                    'appeal_id' => $appealId,
                    'warnings' => $emailErrors
                ]);
            }
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to submit appeal']);
        }
    }

    public function getAllAppeals() {
        header('Content-Type: application/json');
        
        $appeals = $this->contactsModel->getAllAppeals();
        
        if ($appeals !== false) {
            http_response_code(200);
            echo json_encode([
                'message' => 'Appeals retrieved successfully',
                'data' => $appeals
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to retrieve appeals']);
        }
    }

    public function getAppealById($id) {
        header('Content-Type: application/json');
        
        $appeal = $this->contactsModel->getAppealWithEmailHistory($id);
        
        if ($appeal) {
            http_response_code(200);
            echo json_encode([
                'message' => 'Appeal retrieved successfully',
                'data' => $appeal
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Appeal not found']);
        }
    }

    public function updateStatus() {
        header('Content-Type: application/json');
        
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!isset($data['id']) || !isset($data['status'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $validStatuses = ['pending', 'under_review', 'resolved'];
        if (!in_array($data['status'], $validStatuses)) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid status']);
            return;
        }

        $updated = $this->contactsModel->updateAppealStatus($data['id'], $data['status']);
        
        if ($updated) {
            http_response_code(200);
            echo json_encode([
                'message' => 'Status updated successfully',
                'data' => ['id' => $data['id'], 'status' => $data['status']]
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update status']);
        }
    }

    public function sendReply() {
        header('Content-Type: application/json');
        
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!isset($data['id']) || !isset($data['reply_message']) || !isset($data['status'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $appeal = $this->contactsModel->getAppealById($data['id']);
        
        if (!$appeal) {
            http_response_code(404);
            echo json_encode(['message' => 'Appeal not found']);
            return;
        }

        $statusUpdated = $this->contactsModel->updateAppealStatus($data['id'], $data['status']);
        
        if (!$statusUpdated) {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update status']);
            return;
        }

        $contactsEmail = new ContactsEmail();
        $emailSent = $contactsEmail->sendReplyEmail(
            $appeal['email'],
            $appeal['name'],
            $data['reply_message'],
            $data['id'],
            $data['status']
        );

        try {
            $emailSubject = 'Response to Your Ban Appeal - #' . $data['id'];
            $plainMessage = "Reply to ban appeal #{$data['id']}\n\nStatus: {$data['status']}\n\nResponse: {$data['reply_message']}";
            $this->contactsModel->addEmailHistory($data['id'], $appeal['email'], $emailSubject, $plainMessage);
        } catch (Exception $e) {
            error_log('Email history error (non-fatal): ' . $e->getMessage());
        }
        
        if ($emailSent) {
            http_response_code(200);
            echo json_encode([
                'message' => 'Reply sent successfully',
                'data' => [
                    'id' => $data['id'],
                    'status' => $data['status']
                ]
            ]);
        } else {
            http_response_code(207);
            echo json_encode([
                'message' => 'Status updated but email failed',
                'data' => [
                    'id' => $data['id'],
                    'status' => $data['status']
                ],
                'warning' => 'Email notification failed'
            ]);
        }
    }

    public function submitContact() {
        header('Content-Type: application/json');
        
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['name']) || !isset($data['email']) || !isset($data['subject']) || !isset($data['message'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid email address']);
            return;
        }

        $contactId = $this->contactsModel->createContact($data);
        
        if ($contactId) {
            $emailErrors = [];

            $contactsEmail = new ContactsEmail();
            $userEmailSent = $contactsEmail->sendContactUserConfirmation($data['email'], $data['name'], $data['subject'], $contactId);
            if (!$userEmailSent) {
                $emailErrors[] = 'Failed to send confirmation email to user';
            }

            $adminEmailSent = $contactsEmail->sendContactAdminNotification($data);
            if (!$adminEmailSent) {
                $emailErrors[] = 'Failed to send notification email to admin';
            }
            
            if (empty($emailErrors)) {
                http_response_code(201);
                echo json_encode([
                    'message' => 'Contact message submitted successfully',
                    'contact_id' => $contactId
                ]);
            } else {
                http_response_code(201);
                echo json_encode([
                    'message' => 'Contact message submitted successfully',
                    'contact_id' => $contactId,
                    'warnings' => $emailErrors
                ]);
            }
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to submit contact message']);
        }
    }

    public function submitReport() {
        header('Content-Type: application/json');
        
        $data = json_decode(file_get_contents("php://input"), true);

        if (!isset($data['name']) || !isset($data['email']) || !isset($data['subject']) || 
            !isset($data['link']) || !isset($data['description'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid email address']);
            return;
        }

        $validSubjects = ['Bugs', 'Error', 'Glitches', 'System Issue'];
        if (!in_array($data['subject'], $validSubjects)) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid subject']);
            return;
        }

        if (isset($data['images']) && is_array($data['images']) && count($data['images']) > 5) {
            http_response_code(400);
            echo json_encode(['message' => 'Maximum 5 images allowed']);
            return;
        }

        $reportId = $this->generateReportId();

        $reportDbId = $this->contactsModel->createReport($data, $reportId);
        
        if ($reportDbId) {
            $emailErrors = [];

            $contactsEmail = new ContactsEmail();
            $userEmailSent = $contactsEmail->sendReportUserConfirmation($data['email'], $data['name'], $data['subject'], $reportId);
            if (!$userEmailSent) {
                $emailErrors[] = 'Failed to send confirmation email to user';
            }

            $adminEmailSent = $contactsEmail->sendReportAdminNotification($data, $reportId);
            if (!$adminEmailSent) {
                $emailErrors[] = 'Failed to send notification email to admin';
            }
            
            if (empty($emailErrors)) {
                http_response_code(201);
                echo json_encode([
                    'message' => 'Report submitted successfully',
                    'report_id' => $reportId
                ]);
            } else {
                http_response_code(201);
                echo json_encode([
                    'message' => 'Report submitted successfully',
                    'report_id' => $reportId,
                    'warnings' => $emailErrors
                ]);
            }
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to submit report']);
        }
    }

    private function generateReportId() {
        return 'RPT-' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 8));
    }

    public function getAllContacts() {
        header('Content-Type: application/json');
        
        $contacts = $this->contactsModel->getAllContacts();
        
        if ($contacts !== false) {
            http_response_code(200);
            echo json_encode([
                'message' => 'Contacts retrieved successfully',
                'data' => $contacts
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to retrieve contacts']);
        }
    }

    public function getContactById($id) {
        header('Content-Type: application/json');
        
        $contact = $this->contactsModel->getContactWithEmailHistory($id);
        
        if ($contact) {
            http_response_code(200);
            echo json_encode([
                'message' => 'Contact retrieved successfully',
                'data' => $contact
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Contact not found']);
        }
    }

    public function updateContactStatus() {
        header('Content-Type: application/json');
        
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!isset($data['id']) || !isset($data['status'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $validStatuses = ['pending', 'receive', 'under_review', 'resolved'];
        if (!in_array($data['status'], $validStatuses)) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid status']);
            return;
        }

        $updated = $this->contactsModel->updateContactStatus($data['id'], $data['status']);
        
        if ($updated) {
            http_response_code(200);
            echo json_encode([
                'message' => 'Status updated successfully',
                'data' => ['id' => $data['id'], 'status' => $data['status']]
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update status']);
        }
    }

    public function sendContactReply() {
        header('Content-Type: application/json');
        
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!isset($data['id']) || !isset($data['reply_message']) || !isset($data['status'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $contact = $this->contactsModel->getContactById($data['id']);
        
        if (!$contact) {
            http_response_code(404);
            echo json_encode(['message' => 'Contact not found']);
            return;
        }

        $statusUpdated = $this->contactsModel->updateContactStatus($data['id'], $data['status']);
        
        if (!$statusUpdated) {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update status']);
            return;
        }

        $contactsEmail = new ContactsEmail();
        $emailSent = $contactsEmail->sendContactReplyEmail(
            $contact['email'],
            $contact['name'],
            $data['reply_message'],
            $data['id'],
            $data['status']
        );

        try {
            $emailSubject = 'Response to Your Contact Inquiry - #' . $data['id'];
            $plainMessage = "Reply to contact inquiry #{$data['id']}\n\nStatus: {$data['status']}\n\nResponse: {$data['reply_message']}";
            $this->contactsModel->addContactEmailHistory($data['id'], $contact['email'], $emailSubject, $plainMessage);
        } catch (Exception $e) {
            error_log('Email history error (non-fatal): ' . $e->getMessage());
        }
        
        if ($emailSent) {
            http_response_code(200);
            echo json_encode([
                'message' => 'Reply sent successfully',
                'data' => [
                    'id' => $data['id'],
                    'status' => $data['status']
                ]
            ]);
        } else {
            http_response_code(207);
            echo json_encode([
                'message' => 'Status updated but email failed',
                'data' => [
                    'id' => $data['id'],
                    'status' => $data['status']
                ],
                'warning' => 'Email notification failed'
            ]);
        }
    }

    public function getAllReports() {
        header('Content-Type: application/json');
        
        $reports = $this->contactsModel->getAllReports();
        
        if ($reports !== false) {
            http_response_code(200);
            echo json_encode([
                'message' => 'Reports retrieved successfully',
                'data' => $reports
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to retrieve reports']);
        }
    }

    public function getReportById($id) {
        header('Content-Type: application/json');
        
        $report = $this->contactsModel->getReportWithEmailHistory($id);
        
        if ($report) {
            http_response_code(200);
            echo json_encode([
                'message' => 'Report retrieved successfully',
                'data' => $report
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'Report not found']);
        }
    }

    public function updateReportStatus() {
        header('Content-Type: application/json');
        
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!isset($data['id']) || !isset($data['status'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $validStatuses = ['pending', 'receive', 'under_review', 'resolved'];
        if (!in_array($data['status'], $validStatuses)) {
            http_response_code(400);
            echo json_encode(['message' => 'Invalid status']);
            return;
        }

        $updated = $this->contactsModel->updateReportStatus($data['id'], $data['status']);
        
        if ($updated) {
            http_response_code(200);
            echo json_encode([
                'message' => 'Status updated successfully',
                'data' => ['id' => $data['id'], 'status' => $data['status']]
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update status']);
        }
    }

    public function sendReportReply() {
        header('Content-Type: application/json');
        
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!isset($data['id']) || !isset($data['reply_message']) || !isset($data['status'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            return;
        }

        $report = $this->contactsModel->getReportById($data['id']);
        
        if (!$report) {
            http_response_code(404);
            echo json_encode(['message' => 'Report not found']);
            return;
        }

        $statusUpdated = $this->contactsModel->updateReportStatus($data['id'], $data['status']);
        
        if (!$statusUpdated) {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to update status']);
            return;
        }

        $contactsEmail = new ContactsEmail();
        $emailSent = $contactsEmail->sendReportReplyEmail(
            $report['email'],
            $report['name'],
            $data['reply_message'],
            $report['report_id'],
            $data['status']
        );

        try {
            $emailSubject = 'Response to Your Problem Report - ' . $report['report_id'];
            $plainMessage = "Reply to problem report {$report['report_id']}\n\nStatus: {$data['status']}\n\nResponse: {$data['reply_message']}";
            $this->contactsModel->addReportEmailHistory($data['id'], $report['email'], $emailSubject, $plainMessage);
        } catch (Exception $e) {
            error_log('Email history error (non-fatal): ' . $e->getMessage());
        }
        
        if ($emailSent) {
            http_response_code(200);
            echo json_encode([
                'message' => 'Reply sent successfully',
                'data' => [
                    'id' => $data['id'],
                    'status' => $data['status']
                ]
            ]);
        } else {
            http_response_code(207);
            echo json_encode([
                'message' => 'Status updated but email failed',
                'data' => [
                    'id' => $data['id'],
                    'status' => $data['status']
                ],
                'warning' => 'Email notification failed'
            ]);
        }
    }
}
