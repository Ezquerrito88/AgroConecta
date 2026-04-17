<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Stripe\Stripe;
use Stripe\PaymentIntent;

class PaymentController extends Controller
{
    // ─── STRIPE ───────────────────────────────────────────────────────────

    /**
     * Creates a Stripe PaymentIntent and returns the client_secret to the frontend.
     * The frontend uses it to confirm the payment with Stripe.js (card never touches our servers).
     */
    public function createStripeIntent(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.50',
        ]);

        $stripeSecret = config('services.stripe.secret');
        if (!$stripeSecret) {
            return response()->json(['message' => 'Stripe no está configurado.'], 422);
        }

        Stripe::setApiKey($stripeSecret);

        try {
            $intent = PaymentIntent::create([
                'amount'                    => (int) round((float) $request->amount * 100),
                'currency'                  => 'eur',
                'automatic_payment_methods' => ['enabled' => true],
                'metadata'                  => ['user_id' => Auth::id()],
            ]);

            return response()->json([
                'client_secret'     => $intent->client_secret,
                'payment_intent_id' => $intent->id,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al crear PaymentIntent.'], 500);
        }
    }

    // ─── PAYPAL ───────────────────────────────────────────────────────────

    /**
     * Creates a PayPal order and returns the PayPal order ID.
     * The frontend passes this ID to the PayPal JS SDK to open the PayPal popup.
     */
    public function createPaypalOrder(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
        ]);

        $mode = config('services.paypal.mode', 'sandbox');
        $clientId = config("services.paypal.{$mode}_client_id");
        $secret = config("services.paypal.{$mode}_secret");

        if (!$clientId || !$secret) {
            return response()->json(['message' => 'PayPal no está configurado.'], 422);
        }

        try {
            $token = $this->getPaypalToken();

            $response = Http::timeout(10)
                ->withToken($token)
                ->post($this->paypalBaseUrl() . '/v2/checkout/orders', [
                    'intent'         => 'CAPTURE',
                    'purchase_units' => [[
                        'amount' => [
                            'currency_code' => 'EUR',
                            'value'         => number_format((float) $request->amount, 2, '.', ''),
                        ],
                    ]],
                ]);

            if (!$response->successful()) {
                return response()->json(['message' => 'Error al crear orden PayPal.'], 422);
            }

            return response()->json(['paypal_order_id' => $response->json('id')]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error de conexión con PayPal.',
                'debug'   => $e->getMessage(),  // ← añade esto temporalmente
            ], 500);
        }
    }

    /**
     * Captures an approved PayPal order (called after user approves in PayPal popup).
     */
    public function capturePaypalOrder(Request $request, string $paypalOrderId)
    {
        try {
            $token = $this->getPaypalToken();

            $response = Http::timeout(10)
                ->withToken($token)
                ->post($this->paypalBaseUrl() . "/v2/checkout/orders/{$paypalOrderId}/capture");

            if (!$response->successful()) {
                return response()->json(['message' => 'Error al confirmar el pago PayPal.'], 422);
            }

            $capture = $response->json('purchase_units.0.payments.captures.0');

            return response()->json([
                'status'            => $response->json('status'),
                'paypal_capture_id' => $capture['id'] ?? null,
                'amount'            => $capture['amount']['value'] ?? null,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al capturar pago PayPal.'], 500);
        }
    }

    // ─── HELPERS ──────────────────────────────────────────────────────────

    private function getPaypalToken(): string
    {
        $mode     = config('services.paypal.mode', 'sandbox');
        $clientId = config("services.paypal.{$mode}_client_id");
        $secret   = config("services.paypal.{$mode}_secret");

        /** @var Response $response */
        $response = Http::asForm()
            ->withoutVerifying()
            ->withBasicAuth($clientId, $secret)
            ->post($this->paypalBaseUrl() . '/v1/oauth2/token', [
                'grant_type' => 'client_credentials',
            ]);

        return $response->json('access_token');
    }

    private function paypalBaseUrl(): string
    {
        return config('services.paypal.mode', 'sandbox') === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';
    }
}
