import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface StripeIntentResponse {
  client_secret: string;
  payment_intent_id: string;
}

export interface PaypalOrderResponse {
  paypal_order_id: string;
}

export interface PaypalCaptureResponse {
  status: string;
  paypal_capture_id: string | null;
  amount: string | null;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createStripeIntent(amount: number): Observable<StripeIntentResponse> {
    return this.http.post<StripeIntentResponse>(`${this.api}/payments/stripe/intent`, { amount });
  }

  createPaypalOrder(amount: number): Observable<PaypalOrderResponse> {
    return this.http.post<PaypalOrderResponse>(`${this.api}/payments/paypal/orders`, { amount });
  }

  capturePaypalOrder(paypalOrderId: string): Observable<PaypalCaptureResponse> {
    return this.http.post<PaypalCaptureResponse>(`${this.api}/payments/paypal/orders/${paypalOrderId}/capture`, {});
  }
}
