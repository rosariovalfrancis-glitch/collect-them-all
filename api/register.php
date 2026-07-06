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

$db = getDB();

$stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['error' => 'Email is already registered.']);
    exit;
}

$hash = password_hash($pass, PASSWORD_DEFAULT);

$stmt = $db->prepare("INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, 0)");
$stmt->execute([$name, $email, $hash]);

echo json_encode([
    'success' => true,
    'user'    => [
        'name'  => $name,
        'email' => $email,
        'is_admin' => 0,
    ],
]);
