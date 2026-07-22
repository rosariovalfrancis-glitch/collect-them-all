<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Use GET']);
    exit;
}

$db = getDB();

try {
    // Fetch all users with order count and total spent
    $stmt = $db->query("
        SELECT 
            u.id,
            u.name,
            u.email,
            u.is_admin,
            u.created_at,
            COUNT(o.id) AS order_count,
            COALESCE(SUM(o.total), 0) AS total_spent
        FROM users u
        LEFT JOIN orders o ON o.user_id = u.id
        GROUP BY u.id, u.name, u.email, u.is_admin, u.created_at
        ORDER BY u.created_at DESC
    ");
    
    $customers = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'customers' => $customers,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch customers: ' . $e->getMessage()]);
}
