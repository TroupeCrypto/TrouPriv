/**
 * StripeProvider Component
 * 
 * Fetches Stripe publishable key, creates PaymentIntent with cart lines,
 * and provides Elements context for Payment Element.
 */
import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

interface CartLine {
  sku: string;
  quantity: number;
}

interface StripeProviderProps {
  children: React.ReactNode;
  cart: CartLine[];
  backendUrl?: string;
  orderId?: string;
  currency?: string;
  customerId?: string;
  description?: string;
  metadata?: Record<string, string>;
  onError?: (error: Error) => void;
  onPaymentIntentCreated?: (paymentIntentId: string) => void;
}

interface ConfigResponse {
  publishableKey: string;
}

interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export const StripeProvider: React.FC<StripeProviderProps> = ({
  children,
  cart,
  backendUrl = 'http://localhost:4242',
  orderId,
  currency,
  customerId,
  description,
  metadata,
  onError,
  onPaymentIntentCreated,
}) => {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeStripe = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch publishable key
        const configResponse = await fetch(`${backendUrl}/api/stripe/config`);
        if (!configResponse.ok) {
          throw new Error('Failed to fetch Stripe config');
        }
        const config: ConfigResponse = await configResponse.json();

        if (!isMounted) return;

        // Load Stripe.js
        const stripe = loadStripe(config.publishableKey);
        setStripePromise(stripe);

        // Create PaymentIntent with cart
        const createResponse = await fetch(`${backendUrl}/api/stripe/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cart,
            orderId,
            currency,
            customerId,
            description,
            metadata,
          }),
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          throw new Error(errorData.error || 'Failed to create payment intent');
        }

        const paymentIntentData: CreatePaymentIntentResponse = await createResponse.json();

        if (!isMounted) return;

        setClientSecret(paymentIntentData.clientSecret);
        
        if (onPaymentIntentCreated) {
          onPaymentIntentCreated(paymentIntentData.paymentIntentId);
        }
      } catch (err) {
        if (!isMounted) return;
        
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        
        if (onError && err instanceof Error) {
          onError(err);
        }
        
        console.error('Stripe initialization error:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeStripe();

    return () => {
      isMounted = false;
    };
  }, [backendUrl, cart, orderId, currency, customerId, description, metadata, onError, onPaymentIntentCreated]);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!stripePromise || !clientSecret) {
    return (
      <div style={{ padding: '20px' }}>
        <p>Unable to initialize payment. Please try again.</p>
      </div>
    );
  }

  const appearance = {
    theme: 'stripe' as const,
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
};
