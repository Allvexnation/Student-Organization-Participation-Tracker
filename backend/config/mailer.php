<?php

require_once __DIR__ . '/env.php';

if (!getenv('MAILER_CONNECTION')) {
    loadEnv(__DIR__ . '/../.env');
}

$connection = getenv('MAILER_CONNECTION');

if ($connection === 'Production') {
    return [
        'smtp_host' => getenv('PROD_SMTP_HOST'),
        'smtp_port' => getenv('PROD_SMTP_PORT'),
        'smtp_username' => getenv('PROD_SMTP_USERNAME'),
        'smtp_password' => getenv('PROD_SMTP_PASSWORD'),
        'from_email' => getenv('PROD_SMTP_FROM_EMAIL'),
        'from_name' => getenv('PROD_SMTP_FROM_NAME'),
        'use_tls' => getenv('PROD_SMTP_USE_TLS') === 'true'
    ];
} else {
    return [
        'smtp_host' => getenv('DEV_SMTP_HOST'),
        'smtp_port' => getenv('DEV_SMTP_PORT'),
        'smtp_username' => getenv('DEV_SMTP_USERNAME'),
        'smtp_password' => getenv('DEV_SMTP_PASSWORD'),
        'from_email' => getenv('DEV_SMTP_FROM_EMAIL'),
        'from_name' => getenv('DEV_SMTP_FROM_NAME'),
        'use_tls' => getenv('DEV_SMTP_USE_TLS') === 'true'
    ];
}
