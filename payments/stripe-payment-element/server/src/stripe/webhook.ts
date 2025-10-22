/**
 * Stripe webhook handler with signature verification
 */
import { Router, Request, Response } from 'express';
import bodyParser from 'body-parser';
import Stripe from 'stripe';

// Initialize Stripe with API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const router = Router();

/**
 * POST /webhook
 * Handles Stripe webhook events with signature verification
 * IMPORTANT: This endpoint requires raw body parsing
 */
router.post(
  '/webhook',
  bodyParser.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      console.error('Missing Stripe signature header');
      return res.status(400).send('Missing signature');
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        req.body,
        sig as string,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error('Error processing webhook event:', err);
      res.status(500).send(`Error processing event: ${err.message}`);
    }
  }
);

/**
 * Handle successful payment
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('PaymentIntent succeeded:', paymentIntent.id);
  console.log('Amount:', paymentIntent.amount, paymentIntent.currency);
  console.log('Metadata:', paymentIntent.metadata);

  // TODO: Implement fulfillment logic
  // - Update order status in database
  // - Send confirmation email
  // - Trigger inventory updates
  // - Initiate shipping/delivery process
  // - Log transaction for accounting

  // Example metadata access:
  const orderId = paymentIntent.metadata.orderId;
  const cartLines = paymentIntent.metadata.cartLines;

  if (orderId) {
    console.log(`Processing order: ${orderId}`);
    // Update order status to 'paid' or 'processing'
  }

  if (cartLines) {
    try {
      const parsedCart = JSON.parse(cartLines);
      console.log('Cart items:', parsedCart);
      // Process individual line items for fulfillment
    } catch (e) {
      console.error('Failed to parse cart lines from metadata');
    }
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('PaymentIntent failed:', paymentIntent.id);
  console.log('Last payment error:', paymentIntent.last_payment_error);
  console.log('Metadata:', paymentIntent.metadata);

  // TODO: Implement failure handling logic
  // - Update order status to 'payment_failed'
  // - Send failure notification email
  // - Log failed payment attempt
  // - Trigger retry workflow if applicable
  // - Alert customer service if needed

  const orderId = paymentIntent.metadata.orderId;
  if (orderId) {
    console.log(`Payment failed for order: ${orderId}`);
    // Update order status to 'payment_failed'
  }

  // Log failure reason for analytics
  const failureReason = paymentIntent.last_payment_error?.message || 'Unknown';
  console.log(`Failure reason: ${failureReason}`);
}

export default router;
