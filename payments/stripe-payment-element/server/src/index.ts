/**
 * Stripe Payment Element Express Server
 * Provides endpoints for dynamic cart pricing with Stripe
 */
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import stripeRoutes from './stripe/index';
import webhookRoutes from './stripe/webhook';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'STRIPE_WEBHOOK_SECRET',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 4242;

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
};

app.use(cors(corsOptions));

// Webhook route MUST be before express.json() middleware
// because Stripe requires raw body for signature verification
app.use('/api/stripe', webhookRoutes);

// JSON body parser for normal routes
app.use(express.json());

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount Stripe routes
app.use('/api/stripe', stripeRoutes);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Stripe Payment Element server running on port ${PORT}`);
  console.log(`📍 Backend URL: ${process.env.BACKEND_URL || `http://localhost:${PORT}`}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`💳 Payment currency: ${process.env.PAYMENT_CURRENCY || 'usd'}`);
  console.log('\nAvailable endpoints:');
  console.log(`  GET  /health - Health check`);
  console.log(`  GET  /api/stripe/config - Get publishable key`);
  console.log(`  POST /api/stripe/create-payment-intent - Create payment intent`);
  console.log(`  POST /api/stripe/update-payment-intent - Update payment intent`);
  console.log(`  POST /api/stripe/webhook - Webhook handler`);
});

export default app;
