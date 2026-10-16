# Checkout and payment setup

The marketplace continues to support Cash on Delivery without any payment-provider account. Online checkout is optional and uses Razorpay.

## Enable online checkout

1. Create or sign in to a Razorpay account and use **Test Mode** first.
2. In your backend hosting dashboard (for example, Render), open the service's Environment settings.
3. Add:
   - `RAZORPAY_KEY_ID`: your Razorpay test key ID
   - `RAZORPAY_KEY_SECRET`: the matching test key secret
4. Save the environment settings and redeploy the backend.
5. Test checkout with Razorpay's test-mode payment methods. Do not use real customer payment details while testing.
6. Before launch, configure live keys privately in the hosting environment and complete a full test of payment, order creation, stock handling, and notifications.

**Never commit real payment keys to GitHub or put the secret in a frontend environment variable.** The frontend receives only the public key ID from the backend.

## What the integration does

- The backend calculates the amount from MongoDB product prices and the configured delivery fee.
- Razorpay order creation is server-side.
- The backend verifies the Razorpay payment signature before creating the paid order.
- Online checkout stores the payment ID and payment status with the order.
- Cash on Delivery remains available.

## Important deployment notes

- The backend must have a working MongoDB connection. Existing order placement uses MongoDB transactions, so the database must support transactions (Atlas clusters do).
- Set `MONGO_URI`, `JWT_SECRET` (at least 32 characters), and `CLIENT_URL` in the backend environment.
- If the Razorpay keys are absent, online checkout responds with a clear configuration message and Cash on Delivery remains available.
- Verify the integration in test mode before accepting live payments.
