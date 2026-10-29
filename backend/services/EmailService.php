<?php

require_once __DIR__ . '/../config/mailer.php';

class EmailService {
    private $config;

    public function __construct() {
        $this->config = @require __DIR__ . '/../config/mailer.php';
    }

    public function send($to, $subject, $message, $isHTML = true) {
        try {
            $socket = $this->connectSMTP();
            if (!$socket) {
                return false;
            }

            $this->readResponse($socket);

            $this->sendCommand($socket, 'EHLO ' . gethostname());
            $this->readResponse($socket);

            if ($this->config['use_tls']) {
                $this->sendCommand($socket, 'STARTTLS');
                $this->readResponse($socket);

                if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                    fclose($socket);
                    return false;
                }

                $this->sendCommand($socket, 'EHLO ' . gethostname());
                $this->readResponse($socket);
            }

            if ($this->config['smtp_username'] && $this->config['smtp_password']) {
                $this->authenticate($socket);
            }

            $this->sendCommand($socket, 'MAIL FROM: <' . $this->config['from_email'] . '>');
            $this->readResponse($socket);

            $this->sendCommand($socket, 'RCPT TO: <' . $to . '>');
            $this->readResponse($socket);

            $this->sendCommand($socket, 'DATA');
            $this->readResponse($socket);

            $headers = $this->buildHeaders($to, $subject, $isHTML);
            $emailData = $headers . "\r\n\r\n" . $message;

            $this->sendCommand($socket, $emailData . "\r\n.");
            $response = $this->readResponse($socket);

            $this->sendCommand($socket, 'QUIT');
            fclose($socket);

            return strpos($response, '250') === 0;
        } catch (Exception $e) {
            error_log('SMTP Error: ' . $e->getMessage());
            return false;
        }
    }

    private function connectSMTP() {
        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            ]
        ]);

        $socket = stream_socket_client(
            $this->config['smtp_host'] . ':' . $this->config['smtp_port'],
            $errno,
            $errstr,
            5,
            STREAM_CLIENT_CONNECT,
            $context
        );

        if (!$socket) {
            error_log('SMTP Connection failed: ' . $errstr . ' (' . $errno . ')');
            return false;
        }

        return $socket;
    }

    private function authenticate($socket) {
        $this->sendCommand($socket, 'AUTH LOGIN');
        $this->readResponse($socket);

        $this->sendCommand($socket, base64_encode($this->config['smtp_username']));
        $this->readResponse($socket);

        $this->sendCommand($socket, base64_encode($this->config['smtp_password']));
        $this->readResponse($socket);
    }

    private function sendCommand($socket, $command) {
        fwrite($socket, $command . "\r\n");
    }

    private function readResponse($socket) {
        $response = '';
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            if (substr($line, 3, 1) == ' ') {
                break;
            }
        }
        return $response;
    }

    private function buildHeaders($to, $subject, $isHTML) {
        $headers = [];
        $headers[] = 'Date: ' . date('r');
        $headers[] = 'To: ' . $to;
        $headers[] = 'From: ' . $this->config['from_name'] . ' <' . $this->config['from_email'] . '>';
        $headers[] = 'Subject: =?UTF-8?B?' . base64_encode($subject) . '?=';
        $headers[] = 'Reply-To: ' . $this->config['from_email'];
        $headers[] = 'MIME-Version: 1.0';

        if ($isHTML) {
            $headers[] = 'Content-Type: text/html; charset=UTF-8';
        } else {
            $headers[] = 'Content-Type: text/plain; charset=UTF-8';
        }

        $headers[] = 'X-Mailer: PHP/' . phpversion();

        return implode("\r\n", $headers);
    }

}
