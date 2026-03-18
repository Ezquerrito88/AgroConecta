import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom, forkJoin } from 'rxjs';
import { loadScript } from '@paypal/paypal-js';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { CarritoService } from '../../core/services/carrito';
import { CreateOrderPayload, OrderService } from '../../core/services/order';
import { PaymentService } from '../../core/services/payment';
import { environment } from '../../../environments/environment';

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

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CurrencyPipe],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css']
})
export class Checkout implements OnInit {
  private readonly PENDING_CHECKOUT_KEY = 'pending_checkout';
  private readonly CART_DISCOUNT_KEY = 'cart_discount';
  private readonly LAST_ORDER_CONFIRMATION_KEY = 'last_order_confirmation';

  items = [] as ReturnType<CarritoService['getItems']>;
  loading = false;
  errorMessage = '';
  discountCode = '';
  discountPct = 0;
  currentStep = 1;
  paypalApproved = false;

  private stripe: Stripe | null = null;
  private stripeElements: StripeElements | null = null;
  private stripeElementMounted = false;
  private paypalButtonsRendered = false;
  private step3InitPending = false;

  readonly freeShippingThreshold = 20;

  form: CheckoutForm = {
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    notes: '',
    paymentMethod: 'card',
    saveData: true,
    acceptTerms: false,
    cardNumber: '',
    cardHolder: '',
    cardExpiry: '',
    cardCVV: '',
    bizumPhone: '',
    paypalEmail: ''
  };

  constructor(
    private carritoService: CarritoService,
    private orderService: OrderService,
    private paymentService: PaymentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!localStorage.getItem('token')) {
      sessionStorage.setItem(this.PENDING_CHECKOUT_KEY, '1');
      this.router.navigate(['/login'], { queryParams: { redirectTo: '/checkout' } });
      return;
    }

    this.items = this.carritoService.getItems();
    this.carritoService.items$.subscribe(items => {
      this.items = items;
      if (items.length === 0 && !this.loading) {
        this.router.navigate(['/cesta']);
      }
    });

    this.prefillUserData();
    this.loadDiscountFromStorage();
  }

  ngAfterViewChecked(): void {
    if (this.step3InitPending && this.currentStep === 3) {
      this.step3InitPending = false;
      this.initializeStep3PaymentUI();
    }
  }

  get subtotal(): number {
    return this.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  }

  get shipping(): number {
    if (this.items.length === 0) return 0;
    return this.subtotal >= this.freeShippingThreshold ? 0 : 3.99;
  }

  get discount(): number {
    return this.discountPct > 0 ? +(this.subtotal * this.discountPct / 100).toFixed(2) : 0;
  }

  get total(): number {
    return +(this.subtotal - this.discount + this.shipping).toFixed(2);
  }

  get totalItems(): number {
    return this.items.reduce((acc, i) => acc + i.quantity, 0);
  }

  nextStep(): void {
    this.errorMessage = '';
    if (this.currentStep === 1 && !this.isStep1Valid()) {
      this.errorMessage = 'Por favor completa todos los datos de entrega';
      return;
    }
    if (this.currentStep === 1) {
      this.currentStep = 2;
      return;
    }
    if (this.currentStep === 2) {
      this.currentStep = 3;
      this.paypalApproved = false;
      this.stripeElementMounted = false;
      this.paypalButtonsRendered = false;
      this.step3InitPending = true;
      return;
    }
  }

  onPaymentMethodChanged(): void {
    this.errorMessage = '';
    this.paypalApproved = false;
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.errorMessage = '';
    }
  }

  private isStep1Valid(): boolean {
    return !!(
      this.form.fullName.trim() &&
      this.form.email.trim() &&
      this.form.phone.trim() &&
      this.form.address.trim() &&
      this.form.city.trim() &&
      this.form.postalCode.trim()
    );
  }

  private isPaymentDataValid(): boolean {
    switch (this.form.paymentMethod) {
      case 'card':
        return this.stripeElementMounted;
      case 'bizum':
        return /^\d{9}$/.test(this.form.bizumPhone.replace(/\s/g, ''));
      case 'paypal':
        return this.paypalApproved;
      case 'cash_on_delivery':
        return true;
      default:
        return false;
    }
  }

  submit(): void {
    this.errorMessage = '';

    if (!this.isFormValid()) {
      this.errorMessage = 'Completa todos los datos obligatorios y acepta los terminos';
      return;
    }

    if (this.form.paymentMethod === 'paypal') {
      this.errorMessage = 'Pulsa el botón de PayPal para completar el pago';
      return;
    }

    if (!this.isPaymentDataValid()) {
      this.errorMessage = 'Por favor verifica los datos de pago';
      return;
    }

    this.processGatewayPaymentIfNeeded();
  }

  private processGatewayPaymentIfNeeded(): void {
    if (this.form.paymentMethod === 'card') {
      this.confirmStripePayment();
      return;
    }

    this.createOrders();
  }

  private async initializeStep3PaymentUI(): Promise<void> {
    if (this.form.paymentMethod === 'card') {
      await this.initStripePaymentElement();
      return;
    }

    if (this.form.paymentMethod === 'paypal') {
      await this.initPaypalButtons();
    }
  }

  private async initStripePaymentElement(): Promise<void> {
    if (!environment.stripePublicKey || environment.stripePublicKey.includes('replace_me')) {
      this.errorMessage = 'Falta configurar stripePublicKey en frontend.';
      return;
    }

    try {
      this.stripe = this.stripe ?? await loadStripe(environment.stripePublicKey);

      if (!this.stripe) {
        this.errorMessage = 'No se pudo inicializar Stripe.';
        return;
      }

      const intent = await firstValueFrom(this.paymentService.createStripeIntent(this.total));
      this.stripeElements = this.stripe.elements({
        clientSecret: intent.client_secret,
      });

      const paymentElement = this.stripeElements.create('payment');
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

    const { error } = await this.stripe.confirmPayment({
      elements: this.stripeElements,
      redirect: 'if_required',
      confirmParams: {
        payment_method_data: {
          billing_details: {
            name: this.form.fullName,
            email: this.form.email,
            phone: this.form.phone,
          },
        },
      },
    });

    if (error) {
      this.loading = false;
      this.errorMessage = error.message || 'No se pudo confirmar el pago con tarjeta.';
      return;
    }

    this.createOrders();
  }

  private async initPaypalButtons(): Promise<void> {
    if (this.paypalButtonsRendered) return;

    if (!environment.paypalClientId || environment.paypalClientId.includes('replace_me')) {
      this.errorMessage = 'Falta configurar paypalClientId en frontend.';
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
        clientId: environment.paypalClientId,
        currency: 'EUR',
        intent: 'capture',
      });

      if (!paypal) {
        this.errorMessage = 'No se pudo cargar PayPal.';
        return;
      }

      if (!paypal.Buttons) {
        this.errorMessage = 'No se pudo inicializar el botón de PayPal.';
        return;
      }

      await paypal.Buttons({
        createOrder: async () => {
          const response = await firstValueFrom(this.paymentService.createPaypalOrder(this.total));
          return response.paypal_order_id;
        },
        onApprove: async (data: { orderID: string }) => {
          this.loading = true;
          await firstValueFrom(this.paymentService.capturePaypalOrder(data.orderID));
          this.paypalApproved = true;
          this.createOrders();
        },
        onError: () => {
          this.loading = false;
          this.errorMessage = 'No se pudo completar el pago con PayPal.';
        },
      }).render('#paypal-button-container');

      this.paypalButtonsRendered = true;
    } catch {
      this.errorMessage = 'Error cargando el popup de PayPal.';
    }
  }

  private createOrders(): void {

    if (this.items.length === 0) {
      this.router.navigate(['/cesta']);
      return;
    }

    const ordersByFarmer = new Map<number, CreateOrderPayload>();

    for (const item of this.items) {
      if (!item.farmerId) {
        this.errorMessage = 'No se pudo validar el agricultor para ' + item.name;
        return;
      }

      const existing = ordersByFarmer.get(item.farmerId) ?? {
        farmer_id: item.farmerId,
        items: [],
        shipping_address: this.composeShippingAddress(),
        discount_code: this.discountCode || undefined,
        discount_pct: this.discountPct || undefined
      };

      existing.items.push({
        product_id: item.id,
        quantity: item.quantity,
      });

      ordersByFarmer.set(item.farmerId, existing);
    }

    const requests = Array.from(ordersByFarmer.values()).map(payload =>
      this.orderService.createOrder(payload)
    );

    this.loading = true;
    forkJoin(requests).subscribe({
      next: (orders) => {
        sessionStorage.removeItem(this.PENDING_CHECKOUT_KEY);

        localStorage.setItem(this.LAST_ORDER_CONFIRMATION_KEY, JSON.stringify({
          orderIds: orders.map(order => order.id),
          total: this.total,
          totalItems: this.totalItems,
          paymentMethod: this.getPaymentLabel(this.form.paymentMethod),
          discountCode: this.discountCode,
          discountPct: this.discountPct,
          createdAt: new Date().toISOString()
        }));

        this.carritoService.clear();
        this.loading = false;
        this.router.navigate(['/checkout/confirmacion']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message || 'No se pudo tramitar el pedido';
      }
    });
  }

  private isFormValid(): boolean {
    return !!(
      this.form.fullName.trim() &&
      this.form.email.trim() &&
      this.form.phone.trim() &&
      this.form.address.trim() &&
      this.form.city.trim() &&
      this.form.postalCode.trim() &&
      this.form.paymentMethod &&
      this.form.acceptTerms
    );
  }

  private composeShippingAddress(): string {
    const lines = [
      this.form.fullName,
      this.form.address + ', ' + this.form.postalCode + ' ' + this.form.city,
      'Tel: ' + this.form.phone,
      'Pago: ' + this.getPaymentLabel(this.form.paymentMethod),
      this.form.notes ? 'Notas: ' + this.form.notes : ''
    ].filter(Boolean);

    return lines.join(' | ');
  }

  private prefillUserData(): void {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) return;

    try {
      const user = JSON.parse(rawUser);
      this.form.fullName = user?.name ?? '';
      this.form.email = user?.email ?? '';
    } catch {
      // No-op
    }
  }

  private loadDiscountFromStorage(): void {
    const raw = localStorage.getItem(this.CART_DISCOUNT_KEY);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw);
      this.discountCode = String(saved?.code ?? '').toUpperCase();
      this.discountPct = Number(saved?.pct ?? 0);

      if (!this.discountCode || this.discountPct <= 0) {
        this.discountCode = '';
        this.discountPct = 0;
      }
    } catch {
      this.discountCode = '';
      this.discountPct = 0;
    }
  }

  getPaymentLabel(method: CheckoutForm['paymentMethod']): string {
    switch (method) {
      case 'card': return 'Tarjeta';
      case 'paypal': return 'PayPal';
      case 'bizum': return 'Bizum';
      case 'cash_on_delivery': return 'Contra reembolso';
      default: return 'Tarjeta';
    }
  }

  getPaymentHint(method: CheckoutForm['paymentMethod']): string {
    switch (method) {
      case 'card':
        return 'Introduciras los datos de tu tarjeta en el siguiente paso seguro';
      case 'paypal':
        return 'Te redirigiremos a PayPal para completar el pago';
      case 'bizum':
        return 'Recibiras la solicitud de pago en tu movil';
      case 'cash_on_delivery':
        return 'Pagaras cuando recibas el pedido en tu domicilio';
      default:
        return '';
    }
  }

  formatCardNumber(value: string): string {
    return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  }

  formatCardExpiry(value: string): string {
    const cleaned = value.replace(/\D/g, '').substring(0, 4);
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2);
    }
    return cleaned;
  }

  formatBizumPhone(value: string): string {
    const cleaned = value.replace(/\D/g, '').substring(0, 9);
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 5) return cleaned.substring(0, 3) + ' ' + cleaned.substring(3);
    return cleaned.substring(0, 3) + ' ' + cleaned.substring(3, 5) + ' ' + cleaned.substring(5, 7) + ' ' + cleaned.substring(7);
  }

  formatCVV(value: string): string {
    return value.replace(/\D/g, '').substring(0, 4);
  }

  onPostalCodeChange(postalCode: string): void {
    postalCode = postalCode.trim();
    if (postalCode.length < 5) return;
    
    const cityByPostal: { [key: string]: string } = {
      '28001': 'Madrid', '28002': 'Madrid', '28003': 'Madrid', '28004': 'Madrid', '28005': 'Madrid',
      '28006': 'Madrid', '28007': 'Madrid', '28008': 'Madrid', '28009': 'Madrid', '28010': 'Madrid',
      '28011': 'Madrid', '28012': 'Madrid', '28013': 'Madrid', '28014': 'Madrid', '28015': 'Madrid',
      '28016': 'Madrid', '28017': 'Madrid', '28018': 'Madrid', '28019': 'Madrid', '28020': 'Madrid',
      '28021': 'Madrid', '28022': 'Madrid', '28023': 'Madrid', '28024': 'Madrid', '28025': 'Madrid',
      '28026': 'Madrid', '28027': 'Madrid', '28028': 'Madrid', '28029': 'Madrid', '28030': 'Madrid',
      '28031': 'Madrid', '28032': 'Madrid', '28033': 'Madrid', '28034': 'Madrid', '28035': 'Madrid',
      '28036': 'Madrid', '28037': 'Madrid', '28038': 'Madrid', '28039': 'Madrid', '28040': 'Madrid',
      '28041': 'Madrid', '28042': 'Madrid', '28043': 'Madrid', '28044': 'Madrid', '28045': 'Madrid',
      '28046': 'Madrid', '28047': 'Madrid', '28048': 'Madrid', '28049': 'Madrid', '28050': 'Madrid',
      '08001': 'Barcelona', '08002': 'Barcelona', '08003': 'Barcelona', '08004': 'Barcelona', '08005': 'Barcelona',
      '08006': 'Barcelona', '08007': 'Barcelona', '08008': 'Barcelona', '08009': 'Barcelona', '08010': 'Barcelona',
      '08011': 'Barcelona', '08012': 'Barcelona', '08013': 'Barcelona', '08014': 'Barcelona', '08015': 'Barcelona',
      '08016': 'Barcelona', '08017': 'Barcelona', '08018': 'Barcelona', '08019': 'Barcelona', '08020': 'Barcelona',
      '08021': 'Barcelona', '08022': 'Barcelona', '08023': 'Barcelona', '08024': 'Barcelona', '08025': 'Barcelona',
      '08026': 'Barcelona', '08027': 'Barcelona', '08028': 'Barcelona', '08029': 'Barcelona', '08030': 'Barcelona',
      '08031': 'Barcelona', '08032': 'Barcelona', '08033': 'Barcelona', '08034': 'Barcelona', '08035': 'Barcelona',
      '08036': 'Barcelona', '08037': 'Barcelona', '08038': 'Barcelona', '08039': 'Barcelona', '08040': 'Barcelona',
      '08041': 'Barcelona', '08042': 'Barcelona', '08043': 'Barcelona', '08044': 'Barcelona',
      '46001': 'Valencia', '46002': 'Valencia', '46003': 'Valencia', '46004': 'Valencia', '46005': 'Valencia',
      '46006': 'Valencia', '46007': 'Valencia', '46008': 'Valencia', '46009': 'Valencia', '46010': 'Valencia',
      '46011': 'Valencia', '46012': 'Valencia', '46013': 'Valencia', '46014': 'Valencia', '46015': 'Valencia',
      '46016': 'Valencia', '46017': 'Valencia', '46018': 'Valencia', '46019': 'Valencia', '46020': 'Valencia',
      '46021': 'Valencia', '46022': 'Valencia', '46023': 'Valencia', '46024': 'Valencia', '46025': 'Valencia',
      '46026': 'Valencia', '46027': 'Valencia',
      '41001': 'Sevilla', '41002': 'Sevilla', '41003': 'Sevilla', '41004': 'Sevilla', '41005': 'Sevilla',
      '41006': 'Sevilla', '41007': 'Sevilla', '41008': 'Sevilla', '41009': 'Sevilla', '41010': 'Sevilla',
      '41011': 'Sevilla', '41012': 'Sevilla', '41013': 'Sevilla', '41014': 'Sevilla', '41015': 'Sevilla',
      '41016': 'Sevilla', '41017': 'Sevilla', '41018': 'Sevilla', '41019': 'Sevilla', '41020': 'Sevilla',
      '41021': 'Sevilla', '41022': 'Sevilla', '41023': 'Sevilla', '41024': 'Sevilla', '41025': 'Sevilla',
      '14001': 'Córdoba', '14002': 'Córdoba', '14003': 'Córdoba', '14004': 'Córdoba', '14005': 'Córdoba',
      '14006': 'Córdoba', '14007': 'Córdoba', '14008': 'Córdoba', '14009': 'Córdoba', '14010': 'Córdoba',
      '14011': 'Córdoba', '14012': 'Córdoba', '14013': 'Córdoba', '14014': 'Córdoba',
      '18001': 'Granada', '18002': 'Granada', '18003': 'Granada', '18004': 'Granada', '18005': 'Granada',
      '18006': 'Granada', '18007': 'Granada', '18008': 'Granada', '18009': 'Granada', '18010': 'Granada',
      '18011': 'Granada', '18012': 'Granada', '18013': 'Granada', '18014': 'Granada', '18015': 'Granada',
      '18016': 'Granada', '18017': 'Granada', '18018': 'Granada', '18019': 'Granada',
      '29001': 'Málaga', '29002': 'Málaga', '29003': 'Málaga', '29004': 'Málaga', '29005': 'Málaga',
      '29006': 'Málaga', '29007': 'Málaga', '29008': 'Málaga', '29009': 'Málaga', '29010': 'Málaga',
      '29011': 'Málaga', '29012': 'Málaga', '29013': 'Málaga', '29014': 'Málaga', '29015': 'Málaga',
      '29016': 'Málaga', '29017': 'Málaga', '29018': 'Málaga', '29019': 'Málaga', '29020': 'Málaga',
      '29021': 'Málaga',
      '04001': 'Almería', '04002': 'Almería', '04003': 'Almería', '04004': 'Almería', '04005': 'Almería',
      '04006': 'Almería', '04007': 'Almería'
    };
    
    const city = cityByPostal[postalCode];
    if (city) {
      this.form.city = city;
    }
  }

}


