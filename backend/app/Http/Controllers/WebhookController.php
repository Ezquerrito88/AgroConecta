<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use App\Models\Order;
use Stripe\Stripe;
use Stripe\Webhook;
use Stripe\Exception\SignatureVerificationException;

class WebhookController extends Controller
{
    // ─── STRIPE WEBHOOK ───────────────────────────────────────────────────

    /**
     * Handle Stripe webhook events.
     * Verify signature and process payment_intent.succeeded events.
     */
    public function handleStripe(Request $request)
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $webhookSecret = config('services.stripe.webhook_secret');

        if (!$webhookSecret) {
            Log::error('Stripe webhook secret not configured');
            return response()->json(['error' => 'Webhook secret not configured'], 500);
        }

        try {
            Stripe::setApiKey(config('services.stripe.secret'));
            $event = Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
        } catch (\UnexpectedValueException $e) {
            Log::error('Invalid Stripe webhook payload: ' . $e->getMessage());
            return response()->json(['error' => 'Invalid payload'], 400);
        } catch (SignatureVerificationException $e) {
            Log::error('Invalid Stripe webhook signature: ' . $e->getMessage());
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        // Handle the event
        switch ($event->type) {
            case 'payment_intent.succeeded':
                $this->handleStripePaymentSuccess($event->data->object);
                break;

            case 'payment_intent.payment_failed':
                $this->handleStripePaymentFailed($event->data->object);
                break;

            case 'payment_intent.canceled':
                $this->handleStripePaymentCanceled($event->data->object);
                break;

            default:
                Log::info('Unhandled Stripe event type: ' . $event->type);
        }

        return response()->json(['status' => 'success']);
    }

    /**
     * Process successful Stripe payment.
     */
    private function handleStripePaymentSuccess($paymentIntent)
    {
        $paymentIntentId = $paymentIntent->id;
        
        Log::info('Stripe payment succeeded', [
            'payment_intent_id' => $paymentIntentId,
            'amount' => $paymentIntent->amount / 100,
        ]);

        // Update orders (optimized with single query)
        $updated = Order::where('payment_intent_id', $paymentIntentId)
            ->update([
                'payment_status' => 'completed',
                'payment_completed_at' => now(),
            ]);

        if ($updated > 0) {
            Log::info("Updated {$updated} order(s)", ['payment_intent_id' => $paymentIntentId]);
        } else {
            Log::warning('No orders found', ['payment_intent_id' => $paymentIntentId]);
        }
    }

    /**
     * Process failed Stripe payment.
     */
    private function handleStripePaymentFailed($paymentIntent)
    {
        $paymentIntentId = $paymentIntent->id;
        
        Log::warning('Stripe payment failed', [
            'payment_intent_id' => $paymentIntentId,
            'last_payment_error' => $paymentIntent->last_payment_error ?? null,
        ]);

        Order::where('payment_intent_id', $paymentIntentId)->update([
            'payment_status' => 'failed',
        ]);
    }

    /**
     * Process canceled Stripe payment.
     */
    private function handleStripePaymentCanceled($paymentIntent)
    {
        $paymentIntentId = $paymentIntent->id;
        
        Log::info('Stripe payment canceled', ['payment_intent_id' => $paymentIntentId]);

        Order::where('payment_intent_id', $paymentIntentId)->update([
            'payment_status' => 'failed',
        ]);
    }

    // ─── PAYPAL WEBHOOK ───────────────────────────────────────────────────

    /**
     * Handle PayPal webhook events.
     * Verify webhook signature and process payment events.
     */
    public function handlePaypal(Request $request)
    {
        $payload = $request->all();
        $headers = $request->headers->all();

        Log::info('PayPal webhook received', ['event_type' => $payload['event_type'] ?? 'unknown']);

        // Verify PayPal webhook signature
        if (!$this->verifyPaypalWebhook($request)) {
            Log::error('Invalid PayPal webhook signature');
            return response()->json(['error' => 'Invalid signature'], 400);
        }

        // Handle the event
        $eventType = $payload['event_type'] ?? null;

        switch ($eventType) {
            case 'PAYMENT.CAPTURE.COMPLETED':
                $this->handlePaypalPaymentSuccess($payload);
                break;

            case 'PAYMENT.CAPTURE.DENIED':
            case 'PAYMENT.CAPTURE.DECLINED':
                $this->handlePaypalPaymentFailed($payload);
                break;

            default:
                Log::info('Unhandled PayPal event type: ' . $eventType);
        }

        return response()->json(['status' => 'success']);
    }

    /**
     * Process successful PayPal payment.
     */
    private function handlePaypalPaymentSuccess($payload)
    {
        $resource = $payload['resource'] ?? [];
        $captureId = $resource['id'] ?? null;
        
        if (!$captureId) return;

        Log::info('PayPal payment succeeded', [
            'capture_id' => $captureId,
            'amount' => $resource['amount']['value'] ?? null,
        ]);

        // Update orders (optimized with single query)
        $updated = Order::where('payment_transaction_id', $captureId)
            ->update([
                'payment_status' => 'completed',
                'payment_completed_at' => now(),
            ]);

        if ($updated > 0) {
            Log::info("Updated {$updated} order(s)", ['capture_id' => $captureId]);
        } else {
            Log::warning('No orders found', ['capture_id' => $captureId]);
        }
    }

    /**
     * Process failed PayPal payment.
     */
    private function handlePaypalPaymentFailed($payload)
    {
        $resource = $payload['resource'] ?? [];
        $captureId = $resource['id'] ?? null;
        
        Log::warning('PayPal payment failed', ['capture_id' => $captureId]);

        if ($captureId) {
            Order::where('payment_transaction_id', $captureId)->update([
                'payment_status' => 'failed',
            ]);
        }
    }

    /**
     * Verify PayPal webhook signature.
     * https://developer.paypal.com/docs/api-basics/notifications/webhooks/notification-messages/#link-verifywebhooksignature
     */
    private function verifyPaypalWebhook(Request $request): bool
    {
        // Get webhook ID from PayPal dashboard
        $webhookId = config('services.paypal.webhook_id');
        
        if (!$webhookId) {
            Log::warning('PayPal webhook ID not configured, skipping verification');
            return true; // Allow in development, remove in production
        }

        $mode = config('services.paypal.mode', 'sandbox');
        $token = $this->getPaypalToken();
        
        $verificationData = [
            'auth_algo' => $request->header('PAYPAL-AUTH-ALGO'),
            'cert_url' => $request->header('PAYPAL-CERT-URL'),
            'transmission_id' => $request->header('PAYPAL-TRANSMISSION-ID'),
            'transmission_sig' => $request->header('PAYPAL-TRANSMISSION-SIG'),
            'transmission_time' => $request->header('PAYPAL-TRANSMISSION-TIME'),
            'webhook_id' => $webhookId,
            'webhook_event' => $request->all(),
        ];

        $baseUrl = $mode === 'live' 
            ? 'https://api-m.paypal.com' 
            : 'https://api-m.sandbox.paypal.com';

        $response = Http::withToken($token)
            ->post($baseUrl . '/v1/notifications/verify-webhook-signature', $verificationData);

        if ($response->successful() && $response->json('verification_status') === 'SUCCESS') {
            return true;
        }

        Log::error('PayPal webhook verification failed', [
            'response' => $response->json(),
        ]);

        return false;
    }

    /**
     * Get PayPal access token.
     */
    private function getPaypalToken(): string
    {
        $mode = config('services.paypal.mode', 'sandbox');
        $clientId = config("services.paypal.{$mode}_client_id");
        $secret = config("services.paypal.{$mode}_secret");

        $baseUrl = $mode === 'live' 
            ? 'https://api-m.paypal.com' 
            : 'https://api-m.sandbox.paypal.com';

        $response = Http::asForm()
            ->withBasicAuth($clientId, $secret)
            ->post($baseUrl . '/v1/oauth2/token', [
                'grant_type' => 'client_credentials',
            ]);

        return $response->json('access_token');
    }
}
