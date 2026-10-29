<?php

require_once __DIR__ . '/env.php';

loadEnv(__DIR__ . '/../.env');

$connection = getenv('CORS_CONNECTION');

if ($connection === 'Production') {
    $allowedOrigins = getenv('PROD_ALLOWED_ORIGINS') ? array_map('trim', explode(',', getenv('PROD_ALLOWED_ORIGINS'))) : [];
} else {
    $allowedOrigins = getenv('DEV_ALLOWED_ORIGINS') ? array_map('trim', explode(',', getenv('DEV_ALLOWED_ORIGINS'))) : [];
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
