# Stripe Payment Element - React Components Usage Guide

Library-style React TypeScript components for integrating Stripe Payment Element with dynamic cart pricing.

## Installation

These components require the following peer dependencies in your project:

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js react react-dom
```

Or with yarn:

```bash
yarn add @stripe/stripe-js @stripe/react-stripe-js react react-dom
```

## Components

### StripeProvider

Wrapper component that:
- Fetches Stripe publishable key from backend
- Creates PaymentIntent with cart lines
- Initializes Stripe Elements context

### StripeCheckout

Payment form component that:
- Renders the Payment Element
- Handles payment confirmation
- Manages loading and error states

## Basic Usage

```tsx
import React from 'react';
import { StripeProvider } from './payments/stripe-payment-element/client-react/StripeProvider';
import { StripeCheckout } from './payments/stripe-payment-element/client-react/StripeCheckout';

function CheckoutPage() {
  const cart = [
    { sku: 'sku_basic', quantity: 1 },
    { sku: 'sku_pro', quantity: 2 },
  ];

  const handleSuccess = (paymentIntentId: string) => {
    console.log('Payment succeeded!', paymentIntentId);
    // Redirect to success page or show confirmation
    window.location.href = '/order-confirmation';
  };

  const handleError = (error: Error) => {
    console.error('Payment failed:', error.message);
    // Show error message to user
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      <h1>Checkout</h1>
      
      <StripeProvider
        cart={cart}
        backendUrl="http://localhost:4242"
        orderId="order_123"
      >
        <StripeCheckout
          onSuccess={handleSuccess}
          onError={handleError}
          submitButtonText="Complete Payment"
        />
      </StripeProvider>
    </div>
  );
}

export default CheckoutPage;
```

## StripeProvider Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | `ReactNode` | ✅ | Child components (typically StripeCheckout) |
| `cart` | `CartLine[]` | ✅ | Array of cart items with sku and quantity |
| `backendUrl` | `string` | ❌ | Backend API URL (default: 'http://localhost:4242') |
| `orderId` | `string` | ❌ | Order ID for idempotency |
| `currency` | `string` | ❌ | Payment currency (default: backend default) |
| `customerId` | `string` | ❌ | Stripe customer ID |
| `description` | `string` | ❌ | Payment description |
| `metadata` | `Record<string, string>` | ❌ | Custom metadata |
| `onError` | `(error: Error) => void` | ❌ | Error callback |
| `onPaymentIntentCreated` | `(id: string) => void` | ❌ | PaymentIntent created callback |

### CartLine Type

```typescript
interface CartLine {
  sku: string;      // SKU identifier (must exist in backend catalog)
  quantity: number; // Quantity (must be > 0)
}
```

## StripeCheckout Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `returnUrl` | `string` | ❌ | URL to redirect after payment (default: current URL) |
| `onSuccess` | `(paymentIntentId: string) => void` | ❌ | Success callback |
| `onError` | `(error: Error) => void` | ❌ | Error callback |
| `submitButtonText` | `string` | ❌ | Submit button text (default: 'Pay') |
| `submitButtonStyle` | `CSSProperties` | ❌ | Custom button styles |

## Advanced Example

```tsx
import React, { useState } from 'react';
import { StripeProvider } from './payments/stripe-payment-element/client-react/StripeProvider';
import { StripeCheckout } from './payments/stripe-payment-element/client-react/StripeCheckout';

function AdvancedCheckout() {
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');

  const cart = [
    { sku: 'sku_enterprise', quantity: 1 },
  ];

  const handlePaymentIntentCreated = (id: string) => {
    console.log('PaymentIntent created:', id);
    setPaymentIntentId(id);
  };

  const handleSuccess = (id: string) => {
    console.log('Payment succeeded:', id);
    setPaymentStatus('success');
    
    // Send confirmation to analytics
    // analytics.track('payment_completed', { paymentIntentId: id });
    
    // Redirect after delay
    setTimeout(() => {
      window.location.href = `/confirmation?payment_intent=${id}`;
    }, 2000);
  };

  const handleError = (error: Error) => {
    console.error('Payment error:', error);
    setPaymentStatus('error');
    
    // Log error to monitoring service
    // errorLogger.log('payment_error', error);
  };

  if (paymentStatus === 'success') {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>✅ Payment Successful!</h2>
        <p>Redirecting to confirmation page...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>Complete Your Purchase</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Order Summary</h3>
        <p>Enterprise Plan: $99.99</p>
      </div>

      <StripeProvider
        cart={cart}
        backendUrl={process.env.REACT_APP_BACKEND_URL || 'http://localhost:4242'}
        orderId={`order_${Date.now()}`}
        description="Enterprise Plan Subscription"
        metadata={{
          userId: 'user_456',
          source: 'web_checkout',
        }}
        onPaymentIntentCreated={handlePaymentIntentCreated}
        onError={handleError}
      >
        <StripeCheckout
          onSuccess={handleSuccess}
          onError={handleError}
          submitButtonText="Pay $99.99"
          submitButtonStyle={{
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            padding: '14px 28px',
            fontSize: '16px',
            fontWeight: '600',
            borderRadius: '8px',
            cursor: 'pointer',
            width: '100%',
            marginTop: '20px',
          }}
        />
      </StripeProvider>

      {paymentStatus === 'error' && (
        <div style={{ marginTop: '20px', color: 'red' }}>
          <p>Payment failed. Please try again or contact support.</p>
        </div>
      )}
    </div>
  );
}

export default AdvancedCheckout;
```

## Dynamic Cart Updates

If you need to update the cart before payment, create a new PaymentIntent:

```tsx
import React, { useState } from 'react';
import { StripeProvider } from './payments/stripe-payment-element/client-react/StripeProvider';
import { StripeCheckout } from './payments/stripe-payment-element/client-react/StripeCheckout';

function DynamicCartCheckout() {
  const [cart, setCart] = useState([
    { sku: 'sku_basic', quantity: 1 },
  ]);

  const addItem = (sku: string) => {
    setCart([...cart, { sku, quantity: 1 }]);
  };

  return (
    <div>
      <button onClick={() => addItem('sku_pro')}>Add Pro Plan</button>
      
      {/* StripeProvider will re-initialize when cart changes */}
      <StripeProvider
        cart={cart}
        backendUrl="http://localhost:4242"
        key={JSON.stringify(cart)} // Force re-mount on cart change
      >
        <StripeCheckout />
      </StripeProvider>
    </div>
  );
}
```

**Note:** When cart changes, StripeProvider will create a new PaymentIntent. Use the `key` prop to force a re-mount when the cart changes.

## Environment Variables

Set your backend URL via environment variable:

```bash
# .env
REACT_APP_BACKEND_URL=http://localhost:4242
```

Then use it in your component:

```tsx
<StripeProvider
  cart={cart}
  backendUrl={process.env.REACT_APP_BACKEND_URL}
>
  <StripeCheckout />
</StripeProvider>
```

## Error Handling

Both components provide error callbacks:

```tsx
<StripeProvider
  cart={cart}
  onError={(error) => {
    // Handle initialization errors
    console.error('Stripe init error:', error);
    showNotification('Failed to initialize payment. Please refresh.');
  }}
>
  <StripeCheckout
    onError={(error) => {
      // Handle payment errors
      console.error('Payment error:', error);
      showNotification('Payment failed. Please try again.');
    }}
  />
</StripeProvider>
```

## Styling

The Payment Element uses Stripe's default styling. You can customize the appearance through the Elements options:

The components use inline styles by default, but you can:
- Override button styles via `submitButtonStyle` prop
- Wrap components in styled divs
- Use CSS modules or styled-components

Example with custom wrapper:

```tsx
<div className="checkout-container">
  <StripeProvider cart={cart}>
    <StripeCheckout 
      submitButtonStyle={{
        backgroundColor: 'var(--primary-color)',
        borderRadius: 'var(--border-radius)',
      }}
    />
  </StripeProvider>
</div>
```

## TypeScript Support

Both components are written in TypeScript with full type definitions. Import types as needed:

```tsx
import type { CartLine } from './payments/stripe-payment-element/client-react/StripeProvider';

const cart: CartLine[] = [
  { sku: 'sku_basic', quantity: 1 },
];
```

## Testing

For testing, you can mock the Stripe components:

```tsx
// __mocks__/@stripe/react-stripe-js.tsx
export const useStripe = () => ({
  confirmPayment: jest.fn(),
});

export const useElements = () => ({});
export const PaymentElement = () => <div data-testid="payment-element" />;
export const Elements = ({ children }: any) => <div>{children}</div>;
```

## Server Requirements

These components require a backend server with the following endpoints:

- `GET /api/stripe/config` - Returns publishable key
- `POST /api/stripe/create-payment-intent` - Creates PaymentIntent with cart

See the server documentation for setup instructions.

## Available SKUs

The following SKUs are available in the demo catalog (configured in server):

- `sku_basic` - Basic Plan ($9.99)
- `sku_pro` - Pro Plan ($29.99)
- `sku_enterprise` - Enterprise Plan ($99.99)

For production, configure your own SKUs in the backend catalog or use Stripe Products API.

## Security Notes

1. **Never expose secret keys** in client code
2. **Validate all data** server-side (the server validates SKUs and computes totals)
3. **Use HTTPS** in production
4. **Implement webhook handlers** for reliable order fulfillment
5. **Test with Stripe test mode** before going live

## Browser Support

These components support all modern browsers that Stripe.js supports:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## License

Private - Part of TroupeCrypto/TrouPriv
