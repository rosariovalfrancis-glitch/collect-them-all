<?php
// ============================================================
// config.php — Database connection and shared headers
// Called by every endpoint. NEVER store real credentials here.
// All secrets come from environment variables (set in Railway).
// ============================================================

// Allow your GitHub Pages frontend to call this API
$frontendOrigin = getenv('FRONTEND_ORIGIN') ?: '*';
header("Access-Control-Allow-Origin: $frontendOrigin");
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight CORS requests (sent by browser before real request)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function getDB(): PDO {
    $host = getenv('DB_HOST');
    $port = getenv('DB_PORT') ?: '25617';
    $name = getenv('DB_NAME') ?: 'defaultdb';
    $user = getenv('DB_USER') ?: 'avnadmin';
    $pass = getenv('DB_PASS');

    if (!$host || !$pass) {
        http_response_code(500);
        echo json_encode(['error' => 'Database credentials not configured. Set DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS in Railway environment variables.']);
        exit;
    }

    $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
    ];

    try {
        return new PDO($dsn, $user, $pass, $options);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
        exit;
    }
}
