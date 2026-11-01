<?php

require_once __DIR__ . '/../../config/env.php';
loadEnv(__DIR__ . '/../../.env');

class CloudinaryConfig {
    private static $cloudName;
    private static $apiKey;
    private static $apiSecret;
    private static $uploadPreset;

    public static function init() {
        $connection = getenv('CLOUDINARY_CONNECTION') ?: 'Development';
        $prefix = ($connection === 'Production') ? 'PROD_' : 'DEV_';

        self::$cloudName = getenv($prefix . 'CLOUDINARY_CLOUD_NAME') ?: getenv('CLOUDINARY_CLOUD_NAME');
        self::$apiKey = getenv($prefix . 'CLOUDINARY_API_KEY') ?: getenv('CLOUDINARY_API_KEY');
        self::$apiSecret = getenv($prefix . 'CLOUDINARY_API_SECRET') ?: getenv('CLOUDINARY_API_SECRET');
        self::$uploadPreset = getenv($prefix . 'CLOUDINARY_UPLOAD_PRESET') ?: getenv('CLOUDINARY_UPLOAD_PRESET');
    }

    public static function uploadFile($filePath, $folder = 'updates') {
        self::init();

        if (empty(self::$cloudName)) {
            throw new Exception('Cloudinary cloud name is not configured');
        }

        if (!file_exists($filePath) || !is_readable($filePath)) {
            throw new Exception('File does not exist or is not readable: ' . $filePath);
        }

        $timestamp = time();
        $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $filename = pathinfo($filePath, PATHINFO_FILENAME);

        $resourceType = 'auto';
        if (!in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'])) {
            $resourceType = 'raw';
        }

        if ($resourceType === 'raw' && !empty($extension)) {
            $publicId = $folder . '/' . $filename . '_' . $timestamp . '.' . $extension;
        } else {
            $publicId = $folder . '/' . $filename . '_' . $timestamp;
        }

        $cfile = new CURLFile($filePath);
        $url = 'https://api.cloudinary.com/v1_1/' . self::$cloudName . '/' . $resourceType . '/upload';

        if (!empty(self::$uploadPreset)) {
            $postData = [
                'file' => $cfile,
                'upload_preset' => self::$uploadPreset,
                'public_id' => $publicId
            ];
        } elseif (!empty(self::$apiKey) && !empty(self::$apiSecret)) {
            $params = [
                'access_mode' => 'public',
                'public_id' => $publicId,
                'timestamp' => $timestamp
            ];

            $signature = self::generateSignature($params);

            $postData = [
                'file' => $cfile,
                'api_key' => self::$apiKey,
                'timestamp' => $timestamp,
                'signature' => $signature,
                'public_id' => $publicId,
                'access_mode' => 'public'
            ];
        } else {
            throw new Exception('Cloudinary upload preset or API credentials not configured');
        }

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception('cURL Error: ' . $error);
        }

        if ($httpCode !== 200) {
            throw new Exception('Cloudinary API Error (HTTP ' . $httpCode . '): ' . $response);
        }

        $result = json_decode($response, true);

        if (!isset($result['secure_url'])) {
            throw new Exception('Invalid response from Cloudinary: ' . $response);
        }

        return $result['secure_url'];
    }

    private static function generateSignature($params) {
        ksort($params);
        $signatureString = '';
        foreach ($params as $key => $value) {
            $signatureString .= $key . '=' . $value . '&';
        }
        $signatureString = rtrim($signatureString, '&');
        $signatureString .= self::$apiSecret;
        return sha1($signatureString);
    }

    public static function deleteFile($publicId, $resourceType = 'raw') {
        self::init();

        if (empty(self::$cloudName) || empty(self::$apiKey) || empty(self::$apiSecret)) {
            throw new Exception('Cloudinary credentials not configured');
        }

        $timestamp = time();
        $params = [
            'public_id' => $publicId,
            'timestamp' => $timestamp
        ];

        $signature = self::generateSignature($params);

        $ch = curl_init();
        $url = 'https://api.cloudinary.com/v1_1/' . self::$cloudName . '/' . $resourceType . '/destroy';

        $postData = [
            'api_key' => self::$apiKey,
            'timestamp' => $timestamp,
            'signature' => $signature,
            'public_id' => $publicId
        ];

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);
        curl_close($ch);

        return json_decode($response, true);
    }
}
