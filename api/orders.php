<?php
// ============================================================
// orders.php — PATCH endpoint for order status updates
// Handles: status changes, cancellation requests, approve/deny
// ============================================================

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    http_response_code(405);
    echo json_encode(['error' => 'Use PATCH']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$orderNumber = trim($input['orderNumber'] ?? '');
$action = trim($input['action'] ?? '');

if (!$orderNumber || !$action) {
    http_response_code(400);
    echo json_encode(['error' => 'orderNumber and action are required.']);
    exit;
}

$db = getDB();

try {
    // Fetch the order
    $stmt = $db->prepare("SELECT * FROM orders WHERE number = ?");
    $stmt->execute([$orderNumber]);
    $order = $stmt->fetch();

    if (!$order) {
        http_response_code(404);
        echo json_encode(['error' => 'Order not found.']);
        exit;
    }

    switch ($action) {
        case 'cancel_request':
            // Customer requests cancellation — only allowed for non-pre-order, non-terminal statuses
            $blocked = ['Cancelled', 'Delivered', 'Shipped', 'Cancellation Requested'];
            if (in_array($order['status'], $blocked)) {
                http_response_code(400);
                echo json_encode(['error' => 'This order cannot be cancelled.']);
                exit;
            }
            $reason = trim($input['reason'] ?? '');
            $stmt = $db->prepare("UPDATE orders SET status = 'Cancellation Requested', cancel_reason = ? WHERE number = ?");
            $stmt->execute([$reason, $orderNumber]);
            echo json_encode(['success' => true, 'message' => 'Cancellation request submitted.']);
            break;

        case 'cancel_approve':
            // Admin approves cancellation
            $stmt = $db->prepare("UPDATE orders SET status = 'Cancelled' WHERE number = ?");
            $stmt->execute([$orderNumber]);
            echo json_encode(['success' => true, 'message' => 'Order cancelled.']);
            break;

        case 'cancel_deny':
            // Admin denies cancellation — revert to previous status
            $reason = trim($input['reason'] ?? '');
            $revertStatus = trim($input['revertTo'] ?? 'Waiting for Payment');
            $stmt = $db->prepare("UPDATE orders SET status = ?, cancel_reason = NULL WHERE number = ?");
            $stmt->execute([$revertStatus, $orderNumber]);
            echo json_encode(['success' => true, 'message' => "Cancellation denied. Order reverted to '$revertStatus'."]);
            break;

        case 'update_status':
            // Admin updates order status directly
            $newStatus = trim($input['status'] ?? '');
            $allowed = ['Waiting for Payment', 'Deposit Received', 'Deposit Verified', 'Allocation Pending', 'Allocation Confirmed', 'Preparing', 'Shipped', 'Delivered', 'Cancelled'];
            if (!in_array($newStatus, $allowed)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid status value.']);
                exit;
            }
            $stmt = $db->prepare("UPDATE orders SET status = ? WHERE number = ?");
            $stmt->execute([$newStatus, $orderNumber]);
            echo json_encode(['success' => true, 'message' => "Status updated to '$newStatus'."]);
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Unknown action. Use: cancel_request, cancel_approve, cancel_deny, update_status.']);
            break;
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
