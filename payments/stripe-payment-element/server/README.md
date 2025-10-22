# Stripe Payment Element Server

TypeScript Express server for Stripe Payment Element with dynamic cart pricing.

## Features

- **Dynamic cart pricing**: Server-side computation from SKU + quantity
- **PaymentIntent management**: Create and update PaymentIntents
- **Webhook handling**: Signature-verified webhook for order fulfillment
- **Idempotency**: Prevent duplicate PaymentIntents via orderId
- **Type-safe**: Full TypeScript implementation
- **Security**: CORS configured, environment-based secrets
- **Stripe API Version**: 2023-10-16

## Setup

### 1. Install Dependencies

```bash
cd payments/stripe-payment-element/server
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your Stripe credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `STRIPE_SECRET_KEY`: Your Stripe secret key (sk_test_...)
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key (pk_test_...)
- `STRIPE_WEBHOOK_SECRET`: Your webhook signing secret (whsec_...)
- `PAYMENT_CURRENCY`: Default payment currency (e.g., 'usd')
- `FRONTEND_URL`: Your frontend URL for CORS (e.g., http://localhost:3000)
- `BACKEND_URL`: Your backend URL (e.g., http://localhost:4242)

### 3. Get Stripe Keys

1. Sign up at [stripe.com](https://stripe.com)
2. Get API keys from: Dashboard → Developers → API keys
3. For webhook secret, see "Testing Webhooks" section below

## Development

### Run Development Server

```bash
npm run dev
```

Server will start on port 4242 (or PORT from .env).

### Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### GET /api/stripe/config

Returns Stripe publishable key for client initialization.

**Response:**
```json
{
  "publishableKey": "pk_test_..."
}
```

### POST /api/stripe/create-payment-intent

Creates a PaymentIntent with dynamic cart pricing.

**Request:**
```json
{
  "orderId": "order_123",
  "cart": [
    { "sku": "sku_basic", "quantity": 1 },
    { "sku": "sku_pro", "quantity": 2 }
  ],
  "currency": "usd",
  "customerId": "cus_123",
  "description": "Order for customer",
  "metadata": {
    "userId": "user_456"
  }
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_yyy",
  "paymentIntentId": "pi_xxx"
}
```

**Fields:**
- `orderId` (optional): Used for idempotency key to prevent duplicate PaymentIntents
- `cart` (required): Array of cart lines with SKU and quantity
- `currency` (optional): Payment currency, defaults to PAYMENT_CURRENCY env var
- `customerId` (optional): Stripe customer ID
- `description` (optional): Payment description
- `metadata` (optional): Custom metadata to attach to PaymentIntent

### POST /api/stripe/update-payment-intent

Updates an existing PaymentIntent with new cart pricing.

**Request:**
```json
{
  "paymentIntentId": "pi_xxx",
  "cart": [
    { "sku": "sku_basic", "quantity": 2 }
  ],
  "currency": "usd",
  "metadata": {
    "updated": "true"
  }
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_yyy",
  "paymentIntentId": "pi_xxx"
}
```

### POST /api/stripe/webhook

Signature-verified webhook endpoint for Stripe events.

Handles:
- `payment_intent.succeeded`: Payment completed successfully
- `payment_intent.payment_failed`: Payment failed

**Note:** This endpoint requires raw body parsing for signature verification.

## Testing Webhooks

### Using Stripe CLI

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli

2. Login to Stripe:
```bash
stripe login
```

3. Forward webhooks to local server:
```bash
stripe listen --forward-to localhost:4242/api/stripe/webhook
```

4. Copy the webhook signing secret (whsec_...) to your `.env` file as `STRIPE_WEBHOOK_SECRET`

5. Trigger test events:
```bash
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
```

## Catalog Configuration

The server uses an in-memory catalog for demo purposes. See `src/pricing/catalog.ts`.

Available SKUs:
- `sku_basic`: Basic Plan - $9.99 USD
- `sku_pro`: Pro Plan - $29.99 USD
- `sku_enterprise`: Enterprise Plan - $99.99 USD

**For Production:** Replace the in-memory catalog with:
- Database queries
- Stripe Products & Prices API
- External pricing service

## Sample cURL Requests

### Get Config
```bash
curl http://localhost:4242/api/stripe/config
```

### Create Payment Intent
```bash
curl -X POST http://localhost:4242/api/stripe/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order_test_001",
    "cart": [
      { "sku": "sku_basic", "quantity": 1 }
    ],
    "description": "Test order"
  }'
```

### Update Payment Intent
```bash
curl -X POST http://localhost:4242/api/stripe/update-payment-intent \
  -H "Content-Type: application/json" \
  -d '{
    "paymentIntentId": "pi_xxx",
    "cart": [
      { "sku": "sku_pro", "quantity": 2 }
    ]
  }'
```

## Error Handling

The server validates:
- Required environment variables on startup
- Cart must be non-empty array
- SKUs must exist in catalog
- Quantities must be positive
- No mixed currencies in cart
- Total amount must be > 0

Errors return appropriate HTTP status codes:
- `400`: Bad request (validation errors)
- `404`: Not found
- `500`: Server error

## Security Considerations

1. **Environment Variables**: Never commit `.env` file
2. **CORS**: Configure `FRONTEND_URL` to match your actual frontend
3. **Webhook Signatures**: Always verify webhook signatures
4. **API Keys**: Use test keys for development, production keys only in production
5. **HTTPS**: Use HTTPS in production for all endpoints

## Idempotency

The server supports idempotency for PaymentIntent creation using the `orderId` field:

- Same `orderId` will return the same PaymentIntent
- Prevents duplicate charges if request is retried
- Idempotency key format: `order_{orderId}`

## Deployment

1. Set environment variables on your hosting platform
2. Build the application: `npm run build`
3. Start the server: `npm start`
4. Configure webhook endpoint in Stripe Dashboard
5. Ensure CORS settings match your frontend domain

## TypeScript

All source code is fully typed. Run type checking:

```bash
npm run typecheck
```

## License

Private - Part of TroupeCrypto/TrouPriv
