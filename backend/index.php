<?php

header('Content-Type: application/json');

$allowedOrigins = [
    'http://localhost:3000',
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
require_once __DIR__ . '/routes/AdviserRoutes.php';
require_once __DIR__ . '/routes/RoleRoutes.php';
require_once __DIR__ . '/routes/StudentsRoutes.php';
require_once __DIR__ . '/routes/OrganizationsRoutes.php';
require_once __DIR__ . '/routes/EventsRoutes.php';
require_once __DIR__ . '/routes/EventRegistrationsRoutes.php';
require_once __DIR__ . '/routes/OrganizationMembershipsRoutes.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];

$uri = strtok($uri, '?');

if ($uri === '/favicon.ico') {
    header('Content-Type: image/vnd.microsoft.icon');
    readfile(__DIR__ . '/view/favicon.ico');
    exit();
}

if ($uri === '/' || $uri === '') {
    header('Content-Type: text/html');
    require_once __DIR__ . '/view/web.php';
    exit();
}

$adminRoutes = new AdminRoutes();
$adviserRoutes = new AdviserRoutes();
$roleRoutes = new RoleRoutes();
$studentsRoutes = new StudentsRoutes();
$organizationsRoutes = new OrganizationsRoutes();
$eventsRoutes = new EventsRoutes();
$eventRegistrationsRoutes = new EventRegistrationsRoutes();
$orgMembershipsRoutes = new OrganizationMembershipsRoutes();

if (strpos($uri, '/api/admin/advisers') === 0) {
    $adviserRoutes->handle($method, $uri);
} elseif (strpos($uri, '/api/admin/roles') === 0) {
    $roleRoutes->handle($method, $uri);
} elseif (strpos($uri, '/api/admin/students') === 0) {
    $studentsRoutes->handle($method, $uri);
} elseif (strpos($uri, '/api/admin/organizations') === 0) {
    $organizationsRoutes->handle($method, $uri);
} elseif (strpos($uri, '/api/admin/events') === 0) {
    $eventsRoutes->handle($method, $uri);
} elseif (strpos($uri, '/api/admin/event-registrations') === 0) {
    $eventRegistrationsRoutes->handle($method, $uri);
} elseif (strpos($uri, '/api/admin/organization-memberships') === 0) {
    $orgMembershipsRoutes->handle($method, $uri);
} else {
    $adminRoutes->handle($method, $uri);
}
