<?php

require_once __DIR__ . '/../config/mailer.php';

class EmailService {
    private $config;

    public function __construct() {
        $this->config = @require __DIR__ . '/../config/mailer.php';
    }

    public function send($to, $subject, $message, $isHTML = true, $maxRetries = 3) {
        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            try {
                $apiKey = $this->config['smtp_password'];
                
                if (!$apiKey) {
                    error_log('Email Service Error: SMTP password not configured');
                    return false;
                }
                
                if (!$to) {
                    error_log('Email Service Error: Recipient email is empty');
                    return false;
                }
                
                $data = [
                    'sender' => [
                        'name' => $this->config['from_name'] ?? 'CRT System',
                        'email' => $this->config['from_email']
                    ],
                    'to' => [
                        [
                            'email' => $to,
                            'name' => explode('@', $to)[0]
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
                curl_setopt($ch, CURLOPT_TIMEOUT, 60);
                curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 30);

                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                $error = curl_error($ch);
                curl_close($ch);

                if ($error) {
                    error_log("Email Service Error (Attempt $attempt/$maxRetries): Curl error - $error. To: $to");
                    if ($attempt < $maxRetries) {
                        sleep(2);
                        continue;
                    }
                    return false;
                }

                if ($httpCode >= 200 && $httpCode < 300) {
                    $responseData = json_decode($response, true);
                    if (isset($responseData['messageId'])) {
                        error_log("Email sent successfully. Message ID: {$responseData['messageId']}. To: $to");
                        return true;
                    }
                    error_log("Email Service Warning: HTTP $httpCode but no messageId in response. To: $to. Response: $response");
                    return true;
                }

                error_log("Email Service Error (Attempt $attempt/$maxRetries): HTTP $httpCode. To: $to. Response: $response");
                if ($attempt < $maxRetries) {
                    sleep(2); 
                    continue;
                }
                return false;
            } catch (Exception $e) {
                error_log("Email Service Exception (Attempt $attempt/$maxRetries): " . $e->getMessage() . ". To: $to");
                if ($attempt < $maxRetries) {
                    sleep(2);
                    continue;
                }
                return false;
            }
        }
        
        return false;
    }

}
