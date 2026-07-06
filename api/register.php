<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Use POST']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$name   = trim($input['name'] ?? '');
$email  = strtolower(trim($input['email'] ?? ''));
$pass   = $input['password'] ?? '';
$code   = trim($input['code'] ?? '');

if (!$name || !$email || !$pass) {
    http_response_code(400);
    echo json_encode(['error' => 'Name, email, and password are required.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email format.']);
    exit;
}

if (strlen($pass) < 4) {
    http_response_code(400);
    echo json_encode(['error' => 'Password must be at least 4 characters.']);
    exit;
}

if (!$code) {
    http_response_code(400);
    echo json_encode(['error' => 'Verification code is required.']);
    exit;
}

$db = getDB();

// Check if email already registered
$stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['error' => 'Email is already registered.']);
    exit;
}

// Verify the code
$stmt = $db->prepare("SELECT code, expires_at FROM verification_codes WHERE email = ? ORDER BY created_at DESC LIMIT 1");
$stmt->execute([$email]);
$row = $stmt->fetch();

if (!$row) {
    http_response_code(400);
    echo json_encode(['error' => 'No verification code found. Request a new code.']);
    exit;
}

if ($row['code'] !== $code) {
    http_response_code(400);
    echo json_encode(['error' => 'Incorrect verification code.']);
    exit;
}

if (strtotime($row['expires_at']) < time()) {
    http_response_code(400);
    echo json_encode(['error' => 'Verification code has expired. Request a new code.']);
    exit;
}

// Code is valid — create the user
$hash = password_hash($pass, PASSWORD_DEFAULT);

$stmt = $db->prepare("INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, 0)");
$stmt->execute([$name, $email, $hash]);

// Delete used verification code
$stmt = $db->prepare("DELETE FROM verification_codes WHERE email = ?");
$stmt->execute([$email]);

echo json_encode([
    'success' => true,
    'user'    => [
        'name'     => $name,
        'email'    => $email,
        'is_admin' => 0,
    ],
]);
