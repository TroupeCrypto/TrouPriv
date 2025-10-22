/**
 * Type definitions for Stripe Payment Element server
 */

export interface CartLine {
  sku: string;
  quantity: number;
}

export interface CreatePaymentIntentBody {
  orderId?: string;
  cart: CartLine[];
  currency?: string;
  customerId?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface UpdatePaymentIntentBody {
  paymentIntentId: string;
  cart: CartLine[];
  currency?: string;
  metadata?: Record<string, string>;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export interface UpdatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}
