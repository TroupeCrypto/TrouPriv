/**
 * StripeCheckout Component
 * 
 * Renders Payment Element and handles payment confirmation.
 */
import React, { useState, FormEvent } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

interface StripeCheckoutProps {
  returnUrl?: string;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: Error) => void;
  submitButtonText?: string;
  submitButtonStyle?: React.CSSProperties;
}

export const StripeCheckout: React.FC<StripeCheckoutProps> = ({
  returnUrl = window.location.href,
  onSuccess,
  onError,
  submitButtonText = 'Pay',
  submitButtonStyle,
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }

    setProcessing(true);
    setErrorMessage(null);

    try {
      // Confirm payment with redirect: 'if_required'
      // This means it will only redirect if required by the payment method
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: 'if_required',
      });

      if (error) {
        // Payment failed
        const errorMsg = error.message || 'An unexpected error occurred.';
        setErrorMessage(errorMsg);
        
        if (onError) {
          onError(new Error(errorMsg));
        }
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded without redirect
        if (onSuccess) {
          onSuccess(paymentIntent.id);
        }
      } else if (paymentIntent) {
        // Payment is in some other state (e.g., processing, requires_action)
        console.log('Payment status:', paymentIntent.status);
        
        // For requires_action, the redirect will have already happened
        // For processing, you might want to poll for status or wait for webhook
        if (paymentIntent.status === 'processing') {
          // Payment is processing, you can show a message
          setErrorMessage('Payment is processing. Please wait...');
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMessage(errorMsg);
      
      if (onError && err instanceof Error) {
        onError(err);
      }
      
      console.error('Payment confirmation error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const defaultButtonStyle: React.CSSProperties = {
    backgroundColor: '#5469d4',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    borderRadius: '4px',
    cursor: processing || !stripe ? 'not-allowed' : 'pointer',
    opacity: processing || !stripe ? 0.6 : 1,
    width: '100%',
    marginTop: '16px',
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      
      {errorMessage && (
        <div
          style={{
            color: '#df1b41',
            fontSize: '14px',
            marginTop: '12px',
            padding: '12px',
            backgroundColor: '#fef2f2',
            borderRadius: '4px',
            border: '1px solid #fee2e2',
          }}
        >
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        style={submitButtonStyle || defaultButtonStyle}
      >
        {processing ? 'Processing...' : submitButtonText}
      </button>
    </form>
  );
};
