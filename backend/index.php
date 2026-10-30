<?php

if (extension_loaded('zlib') && !ini_get('zlib.output_compression')) {
    ini_set('zlib.output_compression', 'On');
    ini_set('zlib.output_compression_level', '6');
}
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json');

require_once __DIR__ . '/config/cors.php';

require_once __DIR__ . '/routes/AdminRoutes.php';
require_once __DIR__ . '/routes/SessionRoutes.php';
require_once __DIR__ . '/routes/AdviserRoutes.php';
require_once __DIR__ . '/routes/AdviserAuthRoutes.php';
require_once __DIR__ . '/routes/Adviser/AdviserOrganizationRoutes.php';
require_once __DIR__ . '/routes/Adviser/AdviserTasksRoutes.php';
require_once __DIR__ . '/routes/RoleRoutes.php';
require_once __DIR__ . '/routes/StudentsRoutes.php';
require_once __DIR__ . '/routes/Students/StudentAuthRoutes.php';
require_once __DIR__ . '/routes/Students/EventTaskRoutes.php';
require_once __DIR__ . '/routes/OrganizationsRoutes.php';
require_once __DIR__ . '/routes/EventsRoutes.php';
require_once __DIR__ . '/routes/EventRegistrationsRoutes.php';
require_once __DIR__ . '/routes/EventOrganizationsRoutes.php';
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
$sessionRoutes = new SessionRoutes();
$adviserRoutes = new AdviserRoutes();
$adviserAuthRoutes = new AdviserAuthRoutes();
$adviserOrganizationRoutes = new AdviserOrganizationRoutes();
$adviserTasksRoutes = new AdviserTasksRoutes();
$roleRoutes = new RoleRoutes();
$studentsRoutes = new StudentsRoutes();
$studentAuthRoutes = new StudentAuthRoutes();
$eventTaskRoutes = new EventTaskRoutes();
$organizationsRoutes = new OrganizationsRoutes();
$eventsRoutes = new EventsRoutes();
$eventRegistrationsRoutes = new EventRegistrationsRoutes();
$eventOrganizationsRoutes = new EventOrganizationsRoutes();
$orgMembershipsRoutes = new OrganizationMembershipsRoutes();

if (strpos($uri, '/api/session') === 0) {
    $sessionRoutes->handle($method, $uri);
} elseif (strpos($uri, '/api/adviser/dashboard') === 0) {
    $adviserRoutes->handle($method, $uri);
} elseif (strpos($uri, '/api/adviser/registered-events') === 0 || strpos($uri, '/api/adviser/organizations-by-event') === 0 || strpos($uri, '/api/adviser/tasks') === 0 || strpos($uri, '/api/adviser/schedule-status') === 0) {
    $adviserTasksRoutes->handle($method, $uri);
} elseif (strpos($uri, '/api/adviser/organization') === 0 || strpos($uri, '/api/adviser/organizations') === 0 || strpos($uri, '/api/adviser/current-organization') === 0 || strpos($uri, '/api/adviser/organization-memberships') === 0) {
    $adviserOrganizationRoutes->handle($method, $uri);
} elseif (strpos($uri, '/api/adviser/auth') === 0 || strpos($uri, '/api/adviser/login') === 0 || strpos($uri, '/api/adviser/logout') === 0 || strpos($uri, '/api/adviser/verify') === 0 || strpos($uri, '/api/adviser/forgot-password') === 0 || strpos($uri, '/api/adviser/verify-otp') === 0 || strpos($uri, '/api/adviser/reset-password') === 0 || strpos($uri, '/api/adviser/profile') === 0) {
    $adviserAuthRoutes->handle($method, $uri);
} elseif (strpos($uri, '/api/student/tasks') === 0 || strpos($uri, '/api/student/schedule-status') === 0) {
    $eventTaskRoutes->handle($method, $uri);
} elseif (strpos($uri, '/api/student') === 0) {
    $studentAuthRoutes->handle($method, $uri);
} elseif (strpos($uri, '/api/admin/advisers') === 0) {
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
} elseif (strpos($uri, '/api/admin/event-organizations') === 0) {
    $eventOrganizationsRoutes->handle($method, $uri);
} elseif (strpos($uri, '/api/admin/organization-memberships') === 0) {
    $orgMembershipsRoutes->handle($method, $uri);
} else {
    $adminRoutes->handle($method, $uri);
}
