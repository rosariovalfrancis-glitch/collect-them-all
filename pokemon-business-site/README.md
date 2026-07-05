# Collect Them All - Frontend Phase

This is the frontend-only version of the Pokemon card shop.

## Customer Flow

Customers do not need an account.

1. Browse Home, Pre-Orders, and Shop.
2. Add products to cart.
3. Checkout as a guest.
4. Pay using the GCash QR code.
5. Send the payment screenshot and order number through Messenger.
6. Track status on the Orders page by entering the order number.

## Before Going Live

Edit `assets/site-config.js`:

- `messengerUrl` — your Messenger link, e.g. `https://m.me/YourPageName`
- `gcashQrImage` — path to your GCash QR image, e.g. `assets/gcash-qr.png`

Save your real GCash QR as `assets/gcash-qr.png` (or update the path in site-config).

## Pages

- `index.html` - landing page
- `login.html` - demo customer login
- `register.html` - demo customer registration
- `shop.html` - Sealed Products, Cards, and Pre-Orders
- `card.html` - single product detail
- `cart.html` - guest cart
- `checkout.html` - GCash checkout instructions
- `orders.html` - order number tracking
- `admin/dashboard.html` - owner/admin mockup
- `assets/site-config.js` - Messenger URL and GCash QR path (edit before launch)
- `assets/styles.css` - shared styling
- `assets/app.js` - product data, cart behavior, demo login, and demo order numbers

## Backend Later

When you move beyond frontend, the important backend pieces are real account saving, order saving, product management, admin login, and status updates.
