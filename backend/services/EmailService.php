<?php

require_once __DIR__ . '/../config/mailer.php';

class EmailService {
    private $config;

    public function __construct() {
        $this->config = @require __DIR__ . '/../config/mailer.php';
    }

    public function send($to, $subject, $message, $isHTML = true) {
        try {
            $apiKey = $this->config['smtp_password'];
            
            $data = [
                'sender' => [
                    'name' => $this->config['from_name'],
                    'email' => $this->config['from_email']
                ],
                'to' => [
                    [
                        'email' => $to
                    ]
                ],
                'subject' => $subject,
                'htmlContent' => $message
            ];

            $ch = curl_init('https://api.brevo.com/v3/smtp/email');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Content-Type: application/json',
                'api-key: ' . $apiKey
            ]);
            curl_setopt($ch, CURLOPT_TIMEOUT, 30);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            curl_close($ch);

            if ($error) {
                error_log('Brevo API Error: ' . $error);
                return false;
            }

            if ($httpCode >= 200 && $httpCode < 300) {
                return true;
            }

            error_log('Brevo API Failed: HTTP ' . $httpCode . ' - ' . $response);
            return false;
        } catch (Exception $e) {
            error_log('Email Service Error: ' . $e->getMessage());
            return false;
        }
    }

}
