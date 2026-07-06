<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Use POST']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$email = strtolower(trim($input['email'] ?? ''));

if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'A valid email is required.']);
    exit;
}

// Check if email already registered
$db = getDB();
$stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['error' => 'Email is already registered.']);
    exit;
}

// Generate 6-digit code
$code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
$expiresAt = date('Y-m-d H:i:s', time() + 900); // 15 minutes

// Store code in database
$stmt = $db->prepare("DELETE FROM verification_codes WHERE email = ?");
$stmt->execute([$email]);

$stmt = $db->prepare("INSERT INTO verification_codes (email, code, expires_at) VALUES (?, ?, ?)");
$stmt->execute([$email, $code, $expiresAt]);

// Send email via Resend
$apiKey = getenv('RESEND_API_KEY');
$sent = false;

if ($apiKey) {
    $html = '
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
        <div style="background:linear-gradient(135deg,#7c3aed,#5b21b6);padding:28px 32px;border-radius:12px 12px 0 0;">
            <h1 style="color:#fff;margin:0;font-size:22px;">Collect Them All</h1>
            <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Email Verification</p>
        </div>
        <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e5e5;">
            <p style="font-size:16px;color:#333;">Hi there,</p>
            <p style="font-size:14px;color:#555;line-height:1.6;">Your verification code for <strong>' . htmlspecialchars($email) . '</strong> is:</p>
            <div style="background:#f8f6ff;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
                <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#7c3aed;">' . $code . '</span>
            </div>
            <p style="font-size:13px;color:#999;">This code expires in 15 minutes. If you did not request this, you can ignore this email.</p>
            <p style="font-size:13px;color:#999;">— Collect Them All</p>
        </div>
    </div>';

    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'from'    => 'Collect Them All <onboarding@resend.dev>',
            'to'      => [$email],
            'subject' => 'Your Verification Code',
            'html'    => $html,
        ]),
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        $sent = true;
    } else {
        error_log("Resend send-code error ({$httpCode}): " . $response);
    }
}

echo json_encode([
    'success' => true,
    'sent'    => $sent,
    'message' => $sent ? 'Verification code sent to your email.' : 'Code generated (email sending unavailable — check RESEND_API_KEY).',
]);
