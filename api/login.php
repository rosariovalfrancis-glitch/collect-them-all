<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Use POST']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$email = strtolower(trim($input['email'] ?? ''));
$pass  = $input['password'] ?? '';

if (!$email || !$pass) {
    http_response_code(400);
    echo json_encode(['error' => 'Email and password are required.']);
    exit;
}

$db = getDB();

$stmt = $db->prepare("SELECT id, name, email, password, is_admin FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'No account found with this email.']);
    exit;
}

if (!password_verify($pass, $user['password'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Incorrect password.']);
    exit;
}

echo json_encode([
    'success' => true,
    'user'    => [
        'id'       => (int) $user['id'],
        'name'     => $user['name'],
        'email'    => $user['email'],
        'is_admin' => (int) $user['is_admin'],
    ],
]);
