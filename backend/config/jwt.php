<?php

require_once __DIR__ . '/env.php';
loadEnv(__DIR__ . '/../.env');

class JWT {
    private static $secret_key;
    private static $algorithm;
    private static $token_expiry;

    private static function initConfig() {
        if (self::$secret_key === null) {
            $connection = getenv('JWT_CONNECTION');

            if ($connection === 'Production') {
                self::$secret_key = $_ENV['PROD_JWT_SECRET_KEY'];
                self::$algorithm = $_ENV['PROD_JWT_ALGORITHM'];
                self::$token_expiry = (int)$_ENV['PROD_JWT_TOKEN_EXPIRY'];
            } else {
                self::$secret_key = $_ENV['DEV_JWT_SECRET_KEY'];
                self::$algorithm = $_ENV['DEV_JWT_ALGORITHM'];
                self::$token_expiry = (int)$_ENV['DEV_JWT_TOKEN_EXPIRY'];
            }
        }
    }

    public static function encode($payload) {
        self::initConfig();
        $header = json_encode(['typ' => 'JWT', 'alg' => self::$algorithm]);
        $payload['exp'] = time() + self::$token_expiry;
        $payload['iat'] = time();

        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::$secret_key, true);
        $base64UrlSignature = self::base64UrlEncode($signature);

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    public static function decode($token) {
        self::initConfig();
        $tokenParts = explode('.', $token);

        if (count($tokenParts) !== 3) {
            return false;
        }

        list($header, $payload, $signature) = $tokenParts;

        $expectedSignature = hash_hmac('sha256', $header . "." . $payload, self::$secret_key, true);
        $base64UrlExpectedSignature = self::base64UrlEncode($expectedSignature);

        if ($signature !== $base64UrlExpectedSignature) {
            return false;
        }

        $decodedPayload = json_decode(self::base64UrlDecode($payload), true);

        if (isset($decodedPayload['exp']) && $decodedPayload['exp'] < time()) {
            return false;
        }

        return $decodedPayload;
    }

    public static function validate($token) {
        return self::decode($token) !== false;
    }

    public static function getUserId($token) {
        $decoded = self::decode($token);
        return $decoded ? $decoded['user_id'] : null;
    }

    public static function getPayload($token) {
        return self::decode($token);
    }

    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
