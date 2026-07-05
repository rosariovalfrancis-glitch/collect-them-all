<?php
// ============================================================
// upload-image.php
// Accepts an image file upload from the admin panel and
// uploads it to Cloudinary. Returns the Cloudinary URL.
// ============================================================

require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Use POST']);
    exit;
}

$cloudName = getenv('CLOUDINARY_CLOUD_NAME');
$apiKey    = getenv('CLOUDINARY_API_KEY');
$apiSecret = getenv('CLOUDINARY_API_SECRET');

if (!$cloudName || !$apiKey || !$apiSecret) {
    http_response_code(500);
    echo json_encode(['error' => 'Cloudinary credentials not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in Railway environment variables.']);
    exit;
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $code = isset($_FILES['file']) ? $_FILES['file']['error'] : 'no file';
    http_response_code(400);
    echo json_encode(['error' => 'File upload failed (error code: ' . $code . ')']);
    exit;
}

$filePath = $_FILES['file']['tmp_name'];
if (!file_exists($filePath)) {
    http_response_code(400);
    echo json_encode(['error' => 'Temporary file not found']);
    exit;
}

// --- Generate Cloudinary signature for signed upload ---
$timestamp = time();
$paramsToSign = "api_key={$apiKey}&timestamp={$timestamp}{$apiSecret}";
$signature = sha1($paramsToSign);

// --- Upload to Cloudinary ---
$ch = curl_init("https://api.cloudinary.com/v1_1/{$cloudName}/image/upload");
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POSTFIELDS     => [
        'file'      => new CURLFile($filePath),
        'api_key'   => $apiKey,
        'timestamp' => $timestamp,
        'signature' => $signature,
    ],
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$data = json_decode($response, true);

if ($httpCode === 200 && isset($data['secure_url'])) {
    echo json_encode([
        'success'    => true,
        'url'        => $data['secure_url'],
        'public_id'  => $data['public_id'] ?? '',
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'error' => 'Cloudinary upload failed',
        'detail' => $data['error']['message'] ?? $response,
    ]);
}
