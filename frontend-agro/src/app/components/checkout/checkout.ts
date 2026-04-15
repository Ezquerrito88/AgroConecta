import {
  Component,
  OnInit,
  AfterViewChecked,
  DestroyRef,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { Subject, firstValueFrom, forkJoin, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { loadScript } from '@paypal/paypal-js';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { CarritoService } from '../../core/services/carrito';
import { CreateOrderPayload, OrderService } from '../../core/services/order';
import { PaymentService } from '../../core/services/payment';
import { environment } from '../../../environments/environment';


// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface CheckoutForm {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  notes: string;
  paymentMethod: 'card' | 'paypal' | 'bizum' | 'cash_on_delivery';
  saveData: boolean;
  acceptTerms: boolean;
  cardNumber: string;
  cardHolder: string;
  cardExpiry: string;
  cardCVV: string;
  bizumPhone: string;
  paypalEmail: string;
}

interface SavedUserData {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}

interface ZippopotamResponse {
  'post code': string;
  country: string;
  places: Array<{
    'place name': string;
    state: string;
    'state abbreviation': string;
    latitude: string;
    longitude: string;
  }>;
}


// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CurrencyPipe],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css'],
})
export class Checkout implements OnInit, AfterViewChecked {

  // ── Storage keys ──────────────────────────
  private readonly PENDING_CHECKOUT_KEY        = 'pending_checkout';
  private readonly CART_DISCOUNT_KEY           = 'cart_discount';
  private readonly LAST_ORDER_CONFIRMATION_KEY = 'last_order_confirmation';
  private readonly SAVED_USER_DATA_KEY         = 'checkout_saved_data';

  // ── DI ────────────────────────────────────
  private readonly destroyRef = inject(DestroyRef);

  // ── Public state ──────────────────────────
  items          = [] as ReturnType<CarritoService['getItems']>;
  loading        = false;
  errorMessage   = '';
  discountCode   = '';
  discountPct    = 0;
  currentStep    = 1;
  paypalApproved = false;

  // ── Postal code autocomplete state ────────
  postalCodeLoading  = false;
  postalCodeError    = false;
  postalCodeResolved = false;

  // ── Postal code Subject (debounce) ────────  ← NUEVO
  private postalCodeSubject = new Subject<string>();

  // ── Private Stripe/PayPal state ───────────
  private stripe: Stripe | null                 = null;
  private stripeElements: StripeElements | null = null;
  private stripeElementMounted  = false;
  private paypalButtonsRendered = false;
  private step3InitPending      = false;
  private paymentIntentId: string | null = null;
  private paypalCaptureId: string | null = null;

  // ── Constants ─────────────────────────────
  readonly freeShippingThreshold = 20;

  // ── Form model ────────────────────────────
  form: CheckoutForm = {
    fullName:      '',
    email:         '',
    phone:         '',
    address:       '',
    city:          '',
    postalCode:    '',
    notes:         '',
    paymentMethod: 'card',
    saveData:      true,
    acceptTerms:   false,
    cardNumber:    '',
    cardHolder:    '',
    cardExpiry:    '',
    cardCVV:       '',
    bizumPhone:    '',
    paypalEmail:   '',
  };

  constructor(
    private carritoService: CarritoService,
    private orderService: OrderService,
    private paymentService: PaymentService,
    private router: Router,
    private http: HttpClient,
  ) {}


  // ════════════════════════════════════════════
  // Lifecycle
  // ════════════════════════════════════════════

  ngOnInit(): void {
    if (!localStorage.getItem('token')) {
      sessionStorage.setItem(this.PENDING_CHECKOUT_KEY, '1');
      this.router.navigate(['/login'], { queryParams: { redirectTo: '/checkout' } });
      return;
    }

    this.items = this.carritoService.getItems();

    this.carritoService.items$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(items => {
        this.items = items;
        if (items.length === 0 && !this.loading) {
          localStorage.removeItem(this.CART_DISCOUNT_KEY);
          this.router.navigate(['/cesta']);
        }
      });

    this.prefillUserData();
    this.loadDiscountFromStorage();
    this.preloadStripe();

    // ── Suscripción al Subject con debounce ──  ← NUEVO
    this.postalCodeSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(code => {
        if (code.length !== 5) {
          this.postalCodeLoading  = false;
          this.postalCodeError    = false;
          this.postalCodeResolved = false;
          this.form.city          = '';
          return of(null);
        }
        this.postalCodeLoading = true;
        this.postalCodeError   = false;
        this.form.city         = '';
        return this.http
          .get<ZippopotamResponse>(`https://api.zippopotam.us/es/${code}`)
          .pipe(catchError(() => of(null)));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(data => {
      this.postalCodeLoading = false;
      if (!data) {
        if (this.form.postalCode.length === 5) {
          this.postalCodeError    = true;
          this.postalCodeResolved = false;
        }
        return;
      }
      if (data.places?.length > 0) {
        this.form.city          = data.places[0]['place name'];
        this.postalCodeError    = false;
        this.postalCodeResolved = true;
      } else {
        this.postalCodeError    = true;
        this.postalCodeResolved = false;
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.step3InitPending && this.currentStep === 3) {
      this.step3InitPending = false;
      this.initializeStep3PaymentUI();
    }
  }


  // ════════════════════════════════════════════
  // Computed getters
  // ════════════════════════════════════════════

  get subtotal(): number {
    return this.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  }

  get shipping(): number {
    if (this.items.length === 0) return 0;
    return this.subtotal >= this.freeShippingThreshold ? 0 : 3.99;
  }

  get discount(): number {
    return this.discountPct > 0
      ? +(this.subtotal * this.discountPct / 100).toFixed(2)
      : 0;
  }

  get total(): number {
    return +(this.subtotal - this.discount + this.shipping).toFixed(2);
  }

  get totalItems(): number {
    return this.items.reduce((acc, i) => acc + i.quantity, 0);
  }


  // ════════════════════════════════════════════
  // Navigation
  // ════════════════════════════════════════════

  nextStep(): void {
    this.errorMessage = '';

    if (this.currentStep === 1) {
      const validationError = this.getStep1ValidationError();
      if (validationError) {
        this.errorMessage = validationError;
        return;
      }
      if (this.form.saveData) this.persistUserData();
      this.currentStep = 2;
      return;
    }

    if (this.currentStep === 2) {
      this.currentStep           = 3;
      this.paypalApproved        = false;
      this.stripeElementMounted  = false;
      this.paypalButtonsRendered = false;
      this.step3InitPending      = true;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.errorMessage = '';
    }
  }

  onPaymentMethodChanged(): void {
    this.errorMessage   = '';
    this.paypalApproved = false;
  }


  // ════════════════════════════════════════════
  // Postal code autocomplete  ← SIMPLIFICADO
  // ════════════════════════════════════════════

  onPostalCodeChange(postalCode: string): void {
    const cleaned = postalCode.replace(/\D/g, '').substring(0, 5);
    this.form.postalCode = cleaned;
    this.postalCodeSubject.next(cleaned);
  }


  // ════════════════════════════════════════════
  // Validation
  // ════════════════════════════════════════════

  private getStep1ValidationError(): string | null {
    const f = this.form;
    if (!f.fullName.trim())                   return 'El nombre completo es obligatorio.';
    if (!this.isValidEmail(f.email))          return 'Introduce un email válido.';
    if (!this.isValidSpanishPhone(f.phone))   return 'Introduce un teléfono válido (9 dígitos).';
    if (!f.address.trim())                    return 'La dirección es obligatoria.';
    if (!/^\d{5}$/.test(f.postalCode.trim())) return 'El código postal debe tener 5 dígitos.';
    if (!f.city.trim())                       return 'La ciudad es obligatoria.';
    return null;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  private isValidSpanishPhone(phone: string): boolean {
    return /^[67]\d{8}$/.test(phone.replace(/\s/g, ''));
  }

  private isPaymentDataValid(): boolean {
    switch (this.form.paymentMethod) {
      case 'card':             return this.stripeElementMounted;
      case 'bizum':            return /^\d{9}$/.test(this.form.bizumPhone.replace(/\s/g, ''));
      case 'paypal':           return this.paypalApproved;
      case 'cash_on_delivery': return true;
      default:                 return false;
    }
  }

  private isFormValid(): boolean {
    return !!(
      this.form.fullName.trim() &&
      this.isValidEmail(this.form.email) &&
      this.isValidSpanishPhone(this.form.phone) &&
      this.form.address.trim() &&
      this.form.city.trim() &&
      /^\d{5}$/.test(this.form.postalCode.trim()) &&
      this.form.paymentMethod &&
      this.form.acceptTerms
    );
  }


  // ════════════════════════════════════════════
  // Submit flow
  // ════════════════════════════════════════════

  submit(): void {
    this.errorMessage = '';

    if (!this.form.acceptTerms) {
      this.errorMessage = 'Debes aceptar los términos y la política de privacidad.';
      return;
    }

    if (!this.isFormValid()) {
      this.errorMessage = 'Completa todos los datos obligatorios.';
      return;
    }

    if (this.form.paymentMethod === 'paypal') {
      this.errorMessage = 'Pulsa el botón de PayPal para completar el pago.';
      return;
    }

    if (!this.isPaymentDataValid()) {
      this.errorMessage = 'Por favor verifica los datos de pago.';
      return;
    }

    this.form.paymentMethod === 'card'
      ? this.confirmStripePayment()
      : this.createOrders();
  }


  // ════════════════════════════════════════════
  // Stripe
  // ════════════════════════════════════════════

  private preloadStripe(): void {
    const key = environment.stripePublicKey;
    if (key && !key.includes('replace_me')) {
      loadStripe(key)
        .then(s => { this.stripe = s; })
        .catch(() => {});
    }
  }

  private async initStripePaymentElement(): Promise<void> {
    const key = environment.stripePublicKey;
    if (!key || key.includes('replace_me')) {
      this.errorMessage = 'Falta configurar stripePublicKey en el entorno.';
      return;
    }

    try {
      this.stripe ??= await loadStripe(key);

      if (!this.stripe) {
        this.errorMessage = 'No se pudo inicializar Stripe.';
        return;
      }

      const intent = await firstValueFrom(
        this.paymentService.createStripeIntent(this.total),
      );

      this.paymentIntentId = intent.payment_intent_id;

      this.stripeElements = this.stripe.elements({
        clientSecret: intent.client_secret,
        appearance: {
          theme: 'stripe',
          variables: { colorPrimary: '#16a34a', borderRadius: '12px' },
        },
      });

      const paymentElement = this.stripeElements.create('payment', {
        layout: 'tabs',
      });

      const host = document.getElementById('stripe-payment-element');
      if (!host) {
        this.errorMessage = 'No se encontró el contenedor de Stripe.';
        return;
      }

      host.innerHTML = '';
      paymentElement.mount('#stripe-payment-element');
      this.stripeElementMounted = true;
    } catch {
      this.errorMessage = 'No se pudo cargar el formulario de Stripe.';
    }
  }

  private async confirmStripePayment(): Promise<void> {
    if (!this.stripe || !this.stripeElements) {
      this.errorMessage = 'Stripe no está listo. Recarga la página e inténtalo de nuevo.';
      return;
    }

    this.loading = true;

    try {
      const { error, paymentIntent } = await this.stripe.confirmPayment({
        elements: this.stripeElements,
        redirect: 'if_required',
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name:  this.form.fullName,
              email: this.form.email,
              phone: this.form.phone,
            },
          },
        },
      });

      if (error) {
        this.loading = false;
        this.errorMessage = this.getStripeErrorMessage(error);
        return;
      }

      if (paymentIntent) this.paymentIntentId = paymentIntent.id;
      this.createOrders();

    } catch {
      this.loading = false;
      this.errorMessage = 'Error al procesar el pago. Inténtalo de nuevo.';
    }
  }

  private getStripeErrorMessage(error: any): string {
    const decline = error.decline_code as string | undefined;

    if (error.code === 'card_declined') {
      const hint = this.isTestMode() ? ' En modo TEST usa: 4242 4242 4242 4242' : '';
      const reasons: Record<string, string> = {
        fraudulent:         `Tarjeta rechazada por sospecha de fraude.${hint}`,
        insufficient_funds: `Fondos insuficientes.${hint}`,
        lost_card:          `Tarjeta reportada como perdida.${hint}`,
        stolen_card:        `Tarjeta reportada como robada.${hint}`,
        generic_decline:    `Tarjeta rechazada.${hint}`,
      };
      return `❌ ${reasons[decline ?? ''] ?? `Tarjeta rechazada (${decline}).${hint}`}`;
    }

    const messages: Record<string, string> = {
      incomplete_number:    '❌ Número de tarjeta incompleto.',
      invalid_number:       '❌ Número de tarjeta inválido.',
      incomplete_expiry:    '❌ Fecha de expiración incompleta.',
      invalid_expiry_month: '❌ Mes de expiración inválido.',
      invalid_expiry_year:  '❌ Año de expiración inválido.',
      expired_card:         '❌ La tarjeta está caducada.',
      incomplete_cvc:       '❌ CVC incompleto.',
      invalid_cvc:          '❌ CVC inválido.',
      processing_error:     '❌ Error al procesar. Inténtalo de nuevo.',
      incorrect_zip:        '❌ Código postal incorrecto.',
    };

    return messages[error.code] ??
      error.message ??
      '❌ No se pudo confirmar el pago. Verifica los datos de tu tarjeta.';
  }


  // ════════════════════════════════════════════
  // PayPal
  // ════════════════════════════════════════════

  private async initPaypalButtons(): Promise<void> {
    if (this.paypalButtonsRendered) return;

    const clientId = environment.paypalClientId;
    if (!clientId || clientId.includes('replace_me')) {
      this.errorMessage = 'Falta configurar paypalClientId en el entorno.';
      return;
    }

    const host = document.getElementById('paypal-button-container');
    if (!host) {
      this.errorMessage = 'No se encontró el contenedor de PayPal.';
      return;
    }

    host.innerHTML = '';

    try {
      const paypal = await loadScript({
        clientId,
        currency: 'EUR',
        intent:   'capture',
      });

      if (!paypal?.Buttons) {
        this.errorMessage = 'No se pudo cargar PayPal.';
        return;
      }

      await paypal.Buttons({
        style: { layout: 'vertical', shape: 'rect' },

        createOrder: async () => {
          const response = await firstValueFrom(
            this.paymentService.createPaypalOrder(this.total),
          );
          return response.paypal_order_id;
        },

        onApprove: async (data: { orderID: string }) => {
          this.loading = true;
          try {
            const capture = await firstValueFrom(
              this.paymentService.capturePaypalOrder(data.orderID),
            );
            this.paypalCaptureId = capture.paypal_capture_id ?? null;
            this.paypalApproved  = true;
            this.createOrders();
          } catch {
            this.loading      = false;
            this.errorMessage = 'Error al capturar el pago de PayPal.';
          }
        },

        onError: (err: any) => {
          this.loading      = false;
          this.errorMessage = 'No se pudo completar el pago con PayPal.';
          console.error('PayPal error:', err);
        },
      }).render('#paypal-button-container');

      this.paypalButtonsRendered = true;
    } catch {
      this.errorMessage = 'Error cargando PayPal.';
    }
  }


  // ════════════════════════════════════════════
  // Order creation
  // ════════════════════════════════════════════

  private createOrders(): void {
    if (this.items.length === 0) {
      this.router.navigate(['/cesta']);
      return;
    }

    const ordersByFarmer = new Map<number, CreateOrderPayload>();

    for (const item of this.items) {
      if (!item.farmerId) {
        this.errorMessage = `No se pudo validar el agricultor para "${item.name}".`;
        this.loading = false;
        return;
      }

      if (!ordersByFarmer.has(item.farmerId)) {
        ordersByFarmer.set(item.farmerId, {
          farmer_id:              item.farmerId,
          items:                  [],
          shipping_address:       this.composeShippingAddress(),
          discount_code:          this.discountCode    || undefined,
          discount_pct:           this.discountPct     || undefined,
          payment_method:         this.form.paymentMethod,
          payment_intent_id:      this.paymentIntentId || undefined,
          payment_transaction_id: this.paypalCaptureId || undefined,
        });
      }

      ordersByFarmer.get(item.farmerId)!.items.push({
        product_id: item.id,
        quantity:   item.quantity,
      });
    }

    this.loading      = true;
    this.errorMessage = '';

    const snapshotTotal       = this.total;
    const snapshotTotalItems  = this.totalItems;
    const snapshotDiscount    = this.discountCode;
    const snapshotDiscountPct = this.discountPct;

    forkJoin(
      Array.from(ordersByFarmer.values()).map(p => this.orderService.createOrder(p)),
    ).subscribe({
      next: orders => {
        localStorage.setItem(
          this.LAST_ORDER_CONFIRMATION_KEY,
          JSON.stringify({
            orderIds:      orders.map(o => o.id),
            total:         snapshotTotal,
            totalItems:    snapshotTotalItems,
            paymentMethod: this.getPaymentLabel(this.form.paymentMethod),
            discountCode:  snapshotDiscount,
            discountPct:   snapshotDiscountPct,
            createdAt:     new Date().toISOString(),
          }),
        );

        this.carritoService.clear();
        sessionStorage.removeItem(this.PENDING_CHECKOUT_KEY);
        localStorage.removeItem(this.CART_DISCOUNT_KEY);

        this.loading = false;
        this.router.navigate(['/checkout/confirmacion']);
      },
      error: err => {
        this.loading      = false;
        this.errorMessage = err?.error?.message ?? 'No se pudo tramitar el pedido. Inténtalo de nuevo.';
      },
    });
  }


  // ════════════════════════════════════════════
  // Step 3 UI init dispatcher
  // ════════════════════════════════════════════

  private async initializeStep3PaymentUI(): Promise<void> {
    if (this.form.paymentMethod === 'card') {
      await this.initStripePaymentElement();
    } else if (this.form.paymentMethod === 'paypal') {
      await this.initPaypalButtons();
    }
  }


  // ════════════════════════════════════════════
  // Data persistence
  // ════════════════════════════════════════════

  private prefillUserData(): void {
    try {
      const user = JSON.parse(localStorage.getItem('user') ?? 'null');
      if (user) {
        this.form.fullName = user.name  ?? '';
        this.form.email    = user.email ?? '';
      }
    } catch { /* no-op */ }

    try {
      const saved: SavedUserData = JSON.parse(
        localStorage.getItem(this.SAVED_USER_DATA_KEY) ?? 'null',
      );
      if (saved) {
        if (saved.fullName)   this.form.fullName   = saved.fullName;
        if (saved.email)      this.form.email      = saved.email;
        if (saved.phone)      this.form.phone      = saved.phone;
        if (saved.address)    this.form.address    = saved.address;
        if (saved.city)       this.form.city       = saved.city;
        if (saved.postalCode) this.form.postalCode = saved.postalCode;
      }
    } catch { /* no-op */ }
  }

  private persistUserData(): void {
    const data: SavedUserData = {
      fullName:   this.form.fullName,
      email:      this.form.email,
      phone:      this.form.phone,
      address:    this.form.address,
      city:       this.form.city,
      postalCode: this.form.postalCode,
    };
    localStorage.setItem(this.SAVED_USER_DATA_KEY, JSON.stringify(data));
  }

  private loadDiscountFromStorage(): void {
    try {
      const saved = JSON.parse(localStorage.getItem(this.CART_DISCOUNT_KEY) ?? 'null');
      const code  = String(saved?.code ?? '').toUpperCase();
      const pct   = Number(saved?.pct ?? 0);
      if (code && pct > 0) {
        this.discountCode = code;
        this.discountPct  = pct;
      }
    } catch {
      this.discountCode = '';
      this.discountPct  = 0;
    }
  }


  // ════════════════════════════════════════════
  // Helpers / formatters
  // ════════════════════════════════════════════

  formatBizumPhone(value: string): string {
    const d = value.replace(/\D/g, '').substring(0, 9);
    if (d.length <= 3) return d;
    if (d.length <= 5) return `${d.slice(0, 3)} ${d.slice(3)}`;
    if (d.length <= 7) return `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5)}`;
    return `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
  }

  formatCardNumber(value: string): string {
    return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  }

  formatCardExpiry(value: string): string {
    const d = value.replace(/\D/g, '').substring(0, 4);
    return d.length >= 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  }

  formatCVV(value: string): string {
    return value.replace(/\D/g, '').substring(0, 4);
  }

  getPaymentLabel(method: CheckoutForm['paymentMethod']): string {
    const labels: Record<CheckoutForm['paymentMethod'], string> = {
      card:             'Tarjeta',
      paypal:           'PayPal',
      bizum:            'Bizum',
      cash_on_delivery: 'Contra reembolso',
    };
    return labels[method] ?? 'Tarjeta';
  }

  getPaymentHint(method: CheckoutForm['paymentMethod']): string {
    const hints: Record<CheckoutForm['paymentMethod'], string> = {
      card:             'Introducirás los datos de tu tarjeta en el paso seguro de Stripe.',
      paypal:           'Se abrirá el popup oficial de PayPal para completar el pago.',
      bizum:            'Recibirás la solicitud de pago en tu móvil.',
      cash_on_delivery: 'Pagarás en efectivo cuando recibas el pedido en tu domicilio.',
    };
    return hints[method] ?? '';
  }

  isTestMode(): boolean {
    return environment.stripePublicKey?.startsWith('pk_test') ?? false;
  }

  private composeShippingAddress(): string {
    return [
      this.form.fullName,
      `${this.form.address}, ${this.form.postalCode} ${this.form.city}`,
      `Tel: ${this.form.phone}`,
      `Pago: ${this.getPaymentLabel(this.form.paymentMethod)}`,
      this.form.notes ? `Notas: ${this.form.notes}` : '',
    ]
      .filter(Boolean)
      .join(' | ');
  }
}