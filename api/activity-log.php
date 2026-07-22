<?php
require_once __DIR__ . '/config.php';

$db = getDB();

// GET: Fetch activity logs
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $limit = min(max((int)($_GET['limit'] ?? 100), 1), 500);
    
    try {
        $stmt = $db->prepare("
            SELECT 
                id,
                admin_email,
                action_type,
                description,
                target_type,
                target_id,
                created_at
            FROM activity_log
            ORDER BY created_at DESC
            LIMIT ?
        ");
        $stmt->execute([$limit]);
        $logs = $stmt->fetchAll();
        
        echo json_encode([
            'success' => true,
            'logs' => $logs,
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch activity log: ' . $e->getMessage()]);
    }
    exit;
}

// POST: Add activity log entry
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $adminEmail = trim($input['admin_email'] ?? '');
    $actionType = trim($input['action_type'] ?? '');
    $description = trim($input['description'] ?? '');
    $targetType = trim($input['target_type'] ?? '');
    $targetId = trim($input['target_id'] ?? '');
    
    if (!$adminEmail || !$actionType || !$description) {
        http_response_code(400);
        echo json_encode(['error' => 'admin_email, action_type, and description are required.']);
        exit;
    }
    
    try {
        $stmt = $db->prepare("
            INSERT INTO activity_log (admin_email, action_type, description, target_type, target_id)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$adminEmail, $actionType, $description, $targetType ?: null, $targetId ?: null]);
        
        echo json_encode([
            'success' => true,
            'id' => $db->lastInsertId(),
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to log activity: ' . $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Use GET or POST']);
