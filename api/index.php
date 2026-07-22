<?php
// ============================================================
// index.php — Router
// Railway runs: php -S 0.0.0.0:$PORT api/index.php
// This file reads the URL path and loads the right endpoint.
// ============================================================

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = rtrim($path, '/');

switch (true) {
    case $path === '/api/test-connection' || $path === '/api/test-connection.php':
        require __DIR__ . '/test-connection.php';
        break;

    case $path === '/api/place-order' || $path === '/api/place-order.php':
        require __DIR__ . '/place-order.php';
        break;

    case $path === '/api/upload-image' || $path === '/api/upload-image.php':
        require __DIR__ . '/upload-image.php';
        break;

    case $path === '/api/register' || $path === '/api/register.php':
        require __DIR__ . '/register.php';
        break;

    case $path === '/api/login' || $path === '/api/login.php':
        require __DIR__ . '/login.php';
        break;

    case $path === '/api/send-code' || $path === '/api/send-code.php':
        require __DIR__ . '/send-code.php';
        break;

    case $path === '/api/customers' || $path === '/api/customers.php':
        require __DIR__ . '/customers.php';
        break;

    case $path === '/api/activity-log' || $path === '/api/activity-log.php':
        require __DIR__ . '/activity-log.php';
        break;

    default:
        http_response_code(404);
        echo json_encode([
            'error' => 'Endpoint not found',
            'available_endpoints' => [
                'GET /api/test-connection',
                'POST /api/place-order',
                'POST /api/upload-image',
                'POST /api/register',
                'POST /api/login',
                'POST /api/send-code',
                'GET /api/customers',
                'GET|POST /api/activity-log',
            ],
        ]);
        break;
}
