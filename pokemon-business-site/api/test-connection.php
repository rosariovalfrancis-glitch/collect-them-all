<?php
// ============================================================
// test-connection.php
// Simple test: connects to DB and returns server time + counts.
// Visit: https://your-railway-url.railway.app/api/test-connection
// ============================================================

require_once __DIR__ . '/config.php';

$db = getDB();

// Try a simple query to confirm the connection works
$productCount = $db->query('SELECT COUNT(*) as count FROM products')->fetch();
$orderCount   = $db->query('SELECT COUNT(*) as count FROM orders')->fetch();
$userCount    = $db->query('SELECT COUNT(*) as count FROM users')->fetch();

echo json_encode([
    'success'  => true,
    'message'  => 'Database connected successfully!',
    'server_time' => date('Y-m-d H:i:s'),
    'tables'   => [
        'products' => (int) $productCount['count'],
        'orders'   => (int) $orderCount['count'],
        'users'    => (int) $userCount['count'],
    ],
]);
