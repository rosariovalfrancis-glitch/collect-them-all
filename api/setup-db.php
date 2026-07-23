<?php
// ============================================================
// setup-db.php — One-time database schema setup / migration
// Visit in browser: https://your-app.up.railway.app/api/setup-db.php?key=setup-collect-them-all-2026
// Creates all required tables if they don't exist.
// After setup, delete this file or remove the route for security.
// ============================================================

require_once __DIR__ . '/config.php';

$key = $_GET['key'] ?? '';
$expectedKey = getenv('SETUP_KEY') ?: 'setup-collect-them-all-2026';

if ($key !== $expectedKey) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid setup key. Visit: ?key=setup-collect-them-all-2026']);
    exit;
}

$db = getDB();
$results = [];

// --- users table ---
$db->exec("
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL DEFAULT '',
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        is_admin TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");
$results[] = 'users: OK';

// Ensure is_admin column exists (safe ALTER for older tables)
try {
    $db->exec("ALTER TABLE users ADD COLUMN is_admin TINYINT(1) NOT NULL DEFAULT 0");
    $results[] = 'users.is_admin: added';
} catch (PDOException $e) {
    if (str_contains($e->getMessage(), 'Duplicate column')) {
        $results[] = 'users.is_admin: already exists';
    } else {
        $results[] = 'users.is_admin: ' . $e->getMessage();
    }
}

// Ensure created_at column exists
try {
    $db->exec("ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
    $results[] = 'users.created_at: added';
} catch (PDOException $e) {
    if (str_contains($e->getMessage(), 'Duplicate column')) {
        $results[] = 'users.created_at: already exists';
    } else {
        $results[] = 'users.created_at: ' . $e->getMessage();
    }
}

// --- verification_codes table ---
$db->exec("
    CREATE TABLE IF NOT EXISTS verification_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(10) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");
$results[] = 'verification_codes: OK';

// --- orders table ---
$db->exec("
    CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        number VARCHAR(50) NOT NULL UNIQUE,
        user_id INT DEFAULT NULL,
        customer_name VARCHAR(255) NOT NULL DEFAULT '',
        contact_number VARCHAR(50) NOT NULL DEFAULT '',
        customer_email VARCHAR(255) NOT NULL DEFAULT '',
        payment_method VARCHAR(100) NOT NULL DEFAULT '',
        delivery_address TEXT,
        province VARCHAR(255) NOT NULL DEFAULT '',
        city VARCHAR(255) NOT NULL DEFAULT '',
        barangay VARCHAR(255) NOT NULL DEFAULT '',
        apartment VARCHAR(255) NOT NULL DEFAULT '',
        zip VARCHAR(20) NOT NULL DEFAULT '',
        notes TEXT,
        total INT NOT NULL DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'Waiting for Payment',
        cancel_reason TEXT DEFAULT NULL,
        has_pre_order TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_number (number),
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_customer_email (customer_email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");
$results[] = 'orders: OK';

// Ensure user_id column exists
try {
    $db->exec("ALTER TABLE orders ADD COLUMN user_id INT DEFAULT NULL");
    $results[] = 'orders.user_id: added';
} catch (PDOException $e) {
    if (str_contains($e->getMessage(), 'Duplicate column')) {
        $results[] = 'orders.user_id: already exists';
    } else {
        $results[] = 'orders.user_id: ' . $e->getMessage();
    }
}

// Ensure cancel_reason column exists
try {
    $db->exec("ALTER TABLE orders ADD COLUMN cancel_reason TEXT DEFAULT NULL");
    $results[] = 'orders.cancel_reason: added';
} catch (PDOException $e) {
    if (str_contains($e->getMessage(), 'Duplicate column')) {
        $results[] = 'orders.cancel_reason: already exists';
    } else {
        $results[] = 'orders.cancel_reason: ' . $e->getMessage();
    }
}

// Ensure has_pre_order column exists
try {
    $db->exec("ALTER TABLE orders ADD COLUMN has_pre_order TINYINT(1) NOT NULL DEFAULT 0");
    $results[] = 'orders.has_pre_order: added';
} catch (PDOException $e) {
    if (str_contains($e->getMessage(), 'Duplicate column')) {
        $results[] = 'orders.has_pre_order: already exists';
    } else {
        $results[] = 'orders.has_pre_order: ' . $e->getMessage();
    }
}

// --- order_items table ---
$db->exec("
    CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_number VARCHAR(50) NOT NULL,
        product_name VARCHAR(255) NOT NULL DEFAULT '',
        qty INT NOT NULL DEFAULT 1,
        type VARCHAR(50) NOT NULL DEFAULT 'Unit',
        line_total INT NOT NULL DEFAULT 0,
        INDEX idx_order_number (order_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");
$results[] = 'order_items: OK';

// --- products table (for featured products & admin product management) ---
$db->exec("
    CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price INT NOT NULL DEFAULT 0,
        compare_at_price INT DEFAULT NULL,
        image_url TEXT,
        category VARCHAR(100) NOT NULL DEFAULT 'booster',
        expansion VARCHAR(255) NOT NULL DEFAULT '',
        stock INT NOT NULL DEFAULT 0,
        featured TINYINT(1) NOT NULL DEFAULT 0,
        sold_out TINYINT(1) NOT NULL DEFAULT 0,
        pre_order TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_featured (featured)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");
$results[] = 'products: OK';

echo json_encode([
    'success' => true,
    'message' => 'Database setup complete.',
    'results' => $results,
]);
