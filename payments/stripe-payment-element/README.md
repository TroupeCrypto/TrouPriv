# Stripe Payment Element Integration

Complete Stripe Payment Element integration with dynamic cart pricing for TroupeCrypto/TrouPriv.

## Overview

This implementation provides a secure, production-ready payment flow using Stripe's Payment Element with server-side cart pricing validation. The architecture consists of:

1. **TypeScript Express Server** - Handles PaymentIntent creation, updates, and webhook processing
2. **React Components** - Provides StripeProvider and StripeCheckout components for easy integration

## Key Features

✅ **Dynamic Cart Pricing** - Server computes totals from SKU + quantity  
✅ **Idempotency** - Prevents duplicate PaymentIntents via orderId  
✅ **Webhook Support** - Signature-verified webhooks for order fulfillment  
✅ **Type Safety** - Full TypeScript implementation  
✅ **Security** - XSS protection, CORS configured, environment-based secrets  
✅ **Automatic Payment Methods** - Supports cards, wallets, and more  

## Project Structure

```
payments/stripe-payment-element/
├── server/                          # Express TypeScript backend
│   ├── src/
│   │   ├── index.ts                # Main server entry point
│   │   ├── stripe/
│   │   │   ├── index.ts            # Payment routes (/config, /create-payment-intent, /update-payment-intent)
│   │   │   ├── webhook.ts          # Webhook handler with signature verification
│   │   │   └── types.ts            # TypeScript type definitions
│   │   └── pricing/
│   │       └── catalog.ts          # In-memory catalog (demo) with pricing logic
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── .gitignore
│   └── README.md                   # Detailed server documentation
│
└── client-react/                    # React TypeScript components
    ├── StripeProvider.tsx          # Fetches config, creates PaymentIntent, provides Elements
    ├── StripeCheckout.tsx          # Renders Payment Element and handles confirmation
    └── USAGE.md                    # Component usage guide with examples
```

## Quick Start

### 1. Server Setup

```bash
cd payments/stripe-payment-element/server

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Stripe keys

# Run development server
npm run dev
```

Server will start on `http://localhost:4242`

See [server/README.md](server/README.md) for detailed server documentation.

### 2. Client Setup

Install peer dependencies in your React app:

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

Import and use the components:

```tsx
import { StripeProvider } from './payments/stripe-payment-element/client-react/StripeProvider';
import { StripeCheckout } from './payments/stripe-payment-element/client-react/StripeCheckout';

function CheckoutPage() {
  const cart = [
    { sku: 'sku_basic', quantity: 1 },
  ];

  return (
    <StripeProvider cart={cart} backendUrl="http://localhost:4242">
      <StripeCheckout
        onSuccess={(paymentIntentId) => {
          console.log('Payment succeeded!', paymentIntentId);
        }}
      />
    </StripeProvider>
  );
}
```

See [client-react/USAGE.md](client-react/USAGE.md) for detailed component documentation.

## API Endpoints

### Server Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/stripe/config` | GET | Returns publishable key |
| `/api/stripe/create-payment-intent` | POST | Creates PaymentIntent with cart |
| `/api/stripe/update-payment-intent` | POST | Updates PaymentIntent amount |
| `/api/stripe/webhook` | POST | Handles Stripe webhooks |

### Request/Response Examples

**Create PaymentIntent:**

```bash
curl -X POST http://localhost:4242/api/stripe/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order_123",
    "cart": [
      { "sku": "sku_basic", "quantity": 1 }
    ]
  }'
```

Response:
```json
{
  "clientSecret": "pi_xxx_secret_yyy",
  "paymentIntentId": "pi_xxx"
}
```

## Available SKUs

Demo catalog includes:

| SKU | Name | Price |
|-----|------|-------|
| `sku_basic` | Basic Plan | $9.99 USD |
| `sku_pro` | Pro Plan | $29.99 USD |
| `sku_enterprise` | Enterprise Plan | $99.99 USD |

**Production Note:** Replace the in-memory catalog in `server/src/pricing/catalog.ts` with:
- Database queries
- Stripe Products & Prices API
- External pricing service

## Configuration

### Environment Variables

Server requires the following environment variables:

```bash
# Stripe credentials
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Payment settings
PAYMENT_CURRENCY=usd

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:4242

# Server port
PORT=4242
```

See `server/.env.example` for the template.

## Security Features

### Implemented Security Measures

1. **Server-Side Validation**
   - Cart items validated against catalog
   - Amounts computed server-side (client cannot manipulate)
   - No mixed currencies allowed
   - Positive amounts enforced

2. **Webhook Security**
   - Signature verification using `STRIPE_WEBHOOK_SECRET`
   - XSS protection (no error message interpolation)
   - Raw body parsing for signature validation

3. **CORS Configuration**
   - Configured to only accept requests from `FRONTEND_URL`
   - Credentials support enabled

4. **Environment Variables**
   - All secrets loaded from environment
   - No hardcoded credentials
   - `.env` excluded via `.gitignore`

5. **TypeScript**
   - Strict mode enabled
   - Full type safety
   - Compile-time error detection

### Security Best Practices

✅ Never expose `STRIPE_SECRET_KEY` to client  
✅ Always verify webhook signatures  
✅ Use HTTPS in production  
✅ Keep Stripe.js and dependencies updated  
✅ Test with Stripe test mode before going live  
✅ Implement proper error handling  
✅ Log security events server-side  

## Testing

### Testing Webhooks Locally

Use Stripe CLI to forward webhooks to your local server:

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:4242/api/stripe/webhook

# Copy the webhook secret (whsec_...) to .env as STRIPE_WEBHOOK_SECRET

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
```

### Testing the Server

```bash
cd payments/stripe-payment-element/server

# Type check
npm run typecheck

# Build
npm run build

# Test endpoints
curl http://localhost:4242/health
curl http://localhost:4242/api/stripe/config
```

## Deployment

### Server Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Set environment variables** on your hosting platform

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Configure webhook endpoint** in Stripe Dashboard:
   - URL: `https://your-domain.com/api/stripe/webhook`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the webhook secret to `STRIPE_WEBHOOK_SECRET`

5. **Enable HTTPS** (required for production)

### Client Deployment

Components are library-style - simply copy them to your React app:

1. Install peer dependencies: `@stripe/stripe-js`, `@stripe/react-stripe-js`
2. Copy `StripeProvider.tsx` and `StripeCheckout.tsx` to your components
3. Configure `backendUrl` to point to your production server
4. Use environment variables for configuration

## Architecture Decisions

### Why Dynamic Pricing?

Server-side cart computation prevents price manipulation and ensures:
- Clients cannot modify prices
- Business logic is centralized
- Prices stay consistent with catalog
- Easy to update pricing without client changes

### Why In-Memory Catalog?

The demo uses an in-memory catalog for simplicity. For production:

**Option 1: Database**
```typescript
// In catalog.ts
export async function getCatalogItem(sku: string) {
  return await db.products.findOne({ sku });
}
```

**Option 2: Stripe Prices API**
```typescript
// In catalog.ts
export async function getCatalogItem(sku: string) {
  const price = await stripe.prices.retrieve(sku);
  return {
    sku: price.id,
    amount: price.unit_amount,
    currency: price.currency,
    name: price.product.name,
  };
}
```

### Why Separate Server?

The server is a standalone Express app to:
- Allow deployment independent of frontend
- Support multiple frontend clients (web, mobile, etc.)
- Enable server-side operations (webhooks, reporting)
- Simplify scaling and monitoring

## Troubleshooting

### Common Issues

**Issue: "Missing Stripe signature header"**
- Ensure webhook endpoint receives raw body
- Check `STRIPE_WEBHOOK_SECRET` is set correctly
- Verify webhook endpoint URL in Stripe Dashboard

**Issue: "Unknown SKU"**
- Check SKU exists in `pricing/catalog.ts`
- Verify SKU spelling matches exactly
- For production, ensure SKU exists in your database/Stripe

**Issue: "CORS error"**
- Verify `FRONTEND_URL` matches your client URL
- Check CORS is enabled before routes
- Ensure credentials are included in fetch requests

**Issue: TypeScript compilation errors**
- Run `npm run typecheck` to see all errors
- Ensure dependencies are installed: `npm install`
- Check TypeScript version compatibility

## Customization

### Adding New SKUs

Edit `server/src/pricing/catalog.ts`:

```typescript
const CATALOG: Record<string, CatalogItem> = {
  sku_new_product: {
    sku: 'sku_new_product',
    name: 'New Product',
    amount: 1999, // $19.99
    currency: 'usd',
  },
  // ... existing SKUs
};
```

### Customizing Payment Element Appearance

Components use Stripe's default theme. To customize:

```tsx
// In StripeProvider.tsx, modify the appearance object:
const appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#0070f3',
    colorBackground: '#ffffff',
    colorText: '#30313d',
    colorDanger: '#df1b41',
    fontFamily: 'Ideal Sans, system-ui, sans-serif',
    spacingUnit: '4px',
    borderRadius: '8px',
  },
};
```

See [Stripe Appearance API](https://stripe.com/docs/elements/appearance-api) for all options.

### Adding Metadata

Pass custom metadata to track orders:

```tsx
<StripeProvider
  cart={cart}
  metadata={{
    userId: 'user_123',
    source: 'web_checkout',
    campaignId: 'promo_2024',
  }}
>
  <StripeCheckout />
</StripeProvider>
```

Metadata is available in webhooks and Stripe Dashboard.

## Production Checklist

Before going live:

- [ ] Replace test keys with production keys
- [ ] Configure production webhook endpoint
- [ ] Enable HTTPS on backend
- [ ] Replace in-memory catalog with database/Stripe Prices
- [ ] Implement proper logging and monitoring
- [ ] Add error tracking (e.g., Sentry)
- [ ] Set up automated backups
- [ ] Configure rate limiting
- [ ] Test payment flow end-to-end
- [ ] Verify webhook handling
- [ ] Check CORS configuration
- [ ] Review security settings
- [ ] Add terms of service and privacy policy links
- [ ] Test with various payment methods
- [ ] Prepare customer support documentation

## Resources

- [Stripe Payment Element Docs](https://stripe.com/docs/payments/payment-element)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [React Stripe.js](https://stripe.com/docs/stripe-js/react)

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review server logs for error details
3. Consult [server/README.md](server/README.md) for server-specific issues
4. Consult [client-react/USAGE.md](client-react/USAGE.md) for client-specific issues
5. Check Stripe logs in Dashboard for payment issues

## License

Private - Part of TroupeCrypto/TrouPriv

---

**Note:** This is a demo implementation. For production use, replace the in-memory catalog with a real database or Stripe Products API, implement proper error handling, add monitoring, and follow all security best practices.
