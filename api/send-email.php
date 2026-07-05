<?php
// ============================================================
// send-email.php
// Sends order confirmation emails via the Resend API.
// Resend API key is stored in the RESEND_API_KEY env variable.
// No Composer dependencies needed — uses PHP's built-in curl.
// ============================================================

function sendOrderConfirmation($orderData) {
    $apiKey = getenv('RESEND_API_KEY');
    if (!$apiKey) {
        error_log('RESEND_API_KEY not set — email not sent');
        return false;
    }

    $customerEmail = $orderData['customerEmail'] ?? '';
    $customerName  = $orderData['customerName'] ?? 'Customer';
    $orderNumber   = $orderData['orderNumber'] ?? 'N/A';
    $total         = number_format((int)($orderData['total'] ?? 0));
    $items         = $orderData['items'] ?? [];
    $contactNumber = $orderData['contactNumber'] ?? '';
    $paymentMethod = $orderData['paymentMethod'] ?? '';
    $deliveryAddr  = $orderData['deliveryAddress'] ?? '';
    $notes         = $orderData['notes'] ?? '';

    // Build items table HTML
    $itemsHtml = '';
    foreach ($items as $item) {
        $name   = htmlspecialchars($item['name'] ?? 'Item');
        $qty    = (int)($item['qty'] ?? 1);
        $type   = htmlspecialchars($item['type'] ?? 'Unit');
        $lineTotal = number_format((int)($item['lineTotal'] ?? 0));
        $itemsHtml .= "<tr>
            <td style=\"padding:8px 12px;border-bottom:1px solid #eee;\">{$name}</td>
            <td style=\"padding:8px 12px;border-bottom:1px solid #eee;text-align:center;\">{$qty}</td>
            <td style=\"padding:8px 12px;border-bottom:1px solid #eee;text-align:center;\">{$type}</td>
            <td style=\"padding:8px 12px;border-bottom:1px solid #eee;text-align:right;\">₱{$lineTotal}</td>
        </tr>";
    }

    $html = '
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
        <div style="background:linear-gradient(135deg,#7c3aed,#5b21b6);padding:28px 32px;border-radius:12px 12px 0 0;">
            <h1 style="color:#fff;margin:0;font-size:22px;">Collect Them All</h1>
            <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Order Confirmed</p>
        </div>
        <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5e5e5;">
            <p style="font-size:16px;color:#333;">Hi <strong>' . htmlspecialchars($customerName) . '</strong>,</p>
            <p style="font-size:14px;color:#555;line-height:1.6;">Thank you for your order! Here is a summary of your purchase.</p>

            <div style="background:#f8f6ff;border-radius:8px;padding:16px;margin:20px 0;">
                <p style="margin:4px 0;font-size:14px;color:#333;"><strong>Order Number:</strong> #' . htmlspecialchars($orderNumber) . '</p>
                <p style="margin:4px 0;font-size:14px;color:#333;"><strong>Payment Method:</strong> ' . htmlspecialchars($paymentMethod) . '</p>
                <p style="margin:4px 0;font-size:14px;color:#333;"><strong>Contact:</strong> ' . htmlspecialchars($contactNumber) . '</p>
                <p style="margin:4px 0;font-size:14px;color:#333;"><strong>Ship to:</strong> ' . htmlspecialchars($deliveryAddr) . '</p>
                ' . ($notes ? '<p style="margin:4px 0;font-size:14px;color:#333;"><strong>Notes:</strong> ' . htmlspecialchars($notes) . '</p>' : '') . '
            </div>

            <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                <thead>
                    <tr style="background:#f5f5f5;">
                        <th style="padding:10px 12px;text-align:left;font-size:13px;color:#666;">Item</th>
                        <th style="padding:10px 12px;text-align:center;font-size:13px;color:#666;">Qty</th>
                        <th style="padding:10px 12px;text-align:center;font-size:13px;color:#666;">Type</th>
                        <th style="padding:10px 12px;text-align:right;font-size:13px;color:#666;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ' . $itemsHtml . '
                </tbody>
            </table>

            <div style="border-top:2px solid #7c3aed;padding-top:14px;margin-top:8px;text-align:right;font-size:20px;font-weight:bold;color:#7c3aed;">
                Total: ₱' . $total . '
            </div>

            <div style="background:#fff8e1;border-radius:8px;padding:16px;margin:24px 0;">
                <p style="margin:0;font-size:13px;color:#8d6e00;line-height:1.5;">
                    <strong>📌 Next Step:</strong> Pay via ' . htmlspecialchars($paymentMethod ?: 'GCash') . ' using the QR code on our website, then send your proof of payment along with your order number on Messenger. We will confirm once your payment is received.
                </p>
            </div>

            <p style="font-size:13px;color:#999;margin-top:24px;">If you have any questions, just reply to this email or message us on Facebook.</p>
            <p style="font-size:13px;color:#999;">— Collect Them All</p>
        </div>
    </div>';

    // Call Resend API
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
            'to'      => [$customerEmail],
            'subject' => 'Order Confirmed — #' . $orderNumber,
            'html'    => $html,
        ]),
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        error_log("Order confirmation email sent to {$customerEmail} for order #{$orderNumber}");
        return true;
    } else {
        error_log("Resend API error ({$httpCode}) for order #{$orderNumber}: " . $response);
        return false;
    }
}
