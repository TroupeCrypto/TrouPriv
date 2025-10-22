/**
 * Stripe Payment Element routes
 */
import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { computeCartTotal } from '../pricing/catalog';
import {
  CreatePaymentIntentBody,
  UpdatePaymentIntentBody,
  CreatePaymentIntentResponse,
  UpdatePaymentIntentResponse,
} from './types';

// Initialize Stripe with API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const router = Router();

/**
 * GET /config - Returns Stripe publishable key
 */
router.get('/config', (req: Request, res: Response) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

/**
 * POST /create-payment-intent
 * Creates a PaymentIntent with dynamic cart pricing
 */
router.post('/create-payment-intent', async (req: Request, res: Response) => {
  try {
    const body = req.body as CreatePaymentIntentBody;

    // Validate request
    if (!body.cart || !Array.isArray(body.cart) || body.cart.length === 0) {
      return res.status(400).json({
        error: 'Cart is required and must be a non-empty array',
      });
    }

    // Compute total from catalog
    const computed = computeCartTotal(
      body.cart,
      body.currency || process.env.PAYMENT_CURRENCY || 'usd'
    );

    // Prepare PaymentIntent parameters
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: computed.amount,
      currency: computed.currency,
      automatic_payment_methods: {
        enabled: true,
      },
    };

    // Add optional parameters
    if (body.customerId) {
      paymentIntentParams.customer = body.customerId;
    }

    if (body.description) {
      paymentIntentParams.description = body.description;
    }

    // Add metadata including cart details
    paymentIntentParams.metadata = {
      ...(body.metadata || {}),
      cartLines: JSON.stringify(computed.lines),
    };

    // Add idempotency key if orderId provided
    const options: Stripe.RequestOptions = {};
    if (body.orderId) {
      options.idempotencyKey = `order_${body.orderId}`;
      paymentIntentParams.metadata.orderId = body.orderId;
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create(
      paymentIntentParams,
      options
    );

    const response: CreatePaymentIntentResponse = {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    res.status(400).json({
      error: error.message || 'Failed to create payment intent',
    });
  }
});

/**
 * POST /update-payment-intent
 * Updates a PaymentIntent with new cart pricing before confirmation
 */
router.post('/update-payment-intent', async (req: Request, res: Response) => {
  try {
    const body = req.body as UpdatePaymentIntentBody;

    // Validate request
    if (!body.paymentIntentId) {
      return res.status(400).json({
        error: 'paymentIntentId is required',
      });
    }

    if (!body.cart || !Array.isArray(body.cart) || body.cart.length === 0) {
      return res.status(400).json({
        error: 'Cart is required and must be a non-empty array',
      });
    }

    // Compute new total from catalog
    const computed = computeCartTotal(
      body.cart,
      body.currency || process.env.PAYMENT_CURRENCY || 'usd'
    );

    // Prepare update parameters
    const updateParams: Stripe.PaymentIntentUpdateParams = {
      amount: computed.amount,
      currency: computed.currency,
    };

    // Update metadata
    updateParams.metadata = {
      ...(body.metadata || {}),
      cartLines: JSON.stringify(computed.lines),
    };

    // Update PaymentIntent
    const paymentIntent = await stripe.paymentIntents.update(
      body.paymentIntentId,
      updateParams
    );

    const response: UpdatePaymentIntentResponse = {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error updating payment intent:', error);
    res.status(400).json({
      error: error.message || 'Failed to update payment intent',
    });
  }
});

export default router;
