<?php

header('Content-Type: application/json');

$allowedOrigins = [
    'http://crtsopt.vercel.app',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/routes/AdminRoutes.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];

$uri = strtok($uri, '?');

$scriptName = dirname($_SERVER['SCRIPT_NAME']);
if (strpos($uri, $scriptName) === 0) {
    $uri = substr($uri, strlen($scriptName));
}

$adminRoutes = new AdminRoutes();
$adminRoutes->handle($method, $uri);
