<?php
// ============================================================
// place-order.php
// Saves a new order from the checkout form to the database.
// The frontend generates the order number and sends it here.
// Called via POST from app.js submitOrderToAPI().
// ============================================================

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Use POST']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON body']);
    exit;
}

// --- Validate required fields ---
$required = ['orderNumber', 'customerName', 'contactNumber', 'items', 'total'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        http_response_code(400);
        echo json_encode(['error' => "Missing required field: $field"]);
        exit;
    }
}

if (!is_array($input['items']) || count($input['items']) === 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Items array cannot be empty']);
    exit;
}

$orderNumber = $input['orderNumber'];

$db = getDB();
$db->beginTransaction();

try {
    // 1) Insert the order
    $stmt = $db->prepare('
        INSERT INTO orders
            (number, customer_name, contact_number, customer_email,
             payment_method, delivery_address, province, city,
             barangay, apartment, zip, notes, total, status)
        VALUES
            (:number, :customer_name, :contact_number, :customer_email,
             :payment_method, :delivery_address, :province, :city,
             :barangay, :apartment, :zip, :notes, :total, :status)
    ');

    $stmt->execute([
        ':number'           => $orderNumber,
        ':customer_name'    => $input['customerName'],
        ':contact_number'   => $input['contactNumber'] ?? '',
        ':customer_email'   => $input['customerEmail'] ?? '',
        ':payment_method'   => $input['paymentMethod'] ?? '',
        ':delivery_address' => $input['deliveryAddress'] ?? '',
        ':province'         => $input['province'] ?? '',
        ':city'             => $input['city'] ?? '',
        ':barangay'         => $input['barangay'] ?? '',
        ':apartment'        => $input['apartment'] ?? '',
        ':zip'              => $input['zip'] ?? '',
        ':notes'            => $input['notes'] ?? '',
        ':total'            => (int) $input['total'],
        ':status'           => 'Waiting for Payment',
    ]);

    // 2) Insert each line item
    $stmtItem = $db->prepare('
        INSERT INTO order_items (order_number, product_name, qty, type, line_total)
        VALUES (:order_number, :product_name, :qty, :type, :line_total)
    ');

    foreach ($input['items'] as $item) {
        $stmtItem->execute([
            ':order_number' => $orderNumber,
            ':product_name' => $item['name'],
            ':qty'          => (int) ($item['qty'] ?? 1),
            ':type'         => $item['type'] ?? 'Unit',
            ':line_total'   => (int) ($item['lineTotal'] ?? 0),
        ]);
    }

    $db->commit();

    http_response_code(201);
    echo json_encode([
        'success'      => true,
        'order_number' => $orderNumber,
        'message'      => 'Order placed successfully!',
    ]);

} catch (Exception $e) {
    $db->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save order: ' . $e->getMessage()]);
}
