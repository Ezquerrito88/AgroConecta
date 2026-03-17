import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CarritoService } from '../../core/services/carrito';

export interface CartItem {
  id: number;
  name: string;
  farmer: string;
  farmerId: number;
  price: number;
  unit: string;
  quantity: number;
  image?: string;
}

@Component({
  selector: 'app-cesta',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CurrencyPipe],
  templateUrl: './cesta.html',
  styleUrls: ['./cesta.css']
})
export class Cesta implements OnInit {
  private readonly PENDING_CHECKOUT_KEY = 'pending_checkout';
  private readonly CART_DISCOUNT_KEY = 'cart_discount';

  items: CartItem[] = [];
  discountCode = '';
  discountApplied = false;
  discountPct = 0;
  discountError = '';
  readonly freeShippingThreshold = 20;

  private readonly VALID_CODES: Record<string, number> = {
    AGRO10: 10,
    AGRO20: 20,
    CAMPO5: 5
  };

  constructor(
    private carritoService: CarritoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.items = this.carritoService.getItems();
    this.carritoService.items$.subscribe(items => {
      this.items = items;
    });

    this.restoreSavedDiscount();
  }

  increase(item: CartItem): void {
    item.quantity++;
    this.carritoService.update(item);
  }

  decrease(item: CartItem): void {
    if (item.quantity <= 1) return;
    item.quantity--;
    this.carritoService.update(item);
  }

  remove(item: CartItem): void {
    this.items = this.items.filter(i => i.id !== item.id);
    this.carritoService.remove(item.id);
  }

  clearCart(): void {
    if (this.items.length === 0) return;
    this.carritoService.clear();
    this.removeDiscount();
  }

  trackById(_: number, item: CartItem): number {
    return item.id;
  }

  get subtotal(): number {
    return this.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  }

  get discount(): number {
    return this.discountApplied ? +(this.subtotal * this.discountPct / 100).toFixed(2) : 0;
  }

  get shipping(): number {
    if (this.items.length === 0) return 0;
    return this.subtotal >= this.freeShippingThreshold ? 0 : 3.99;
  }

  get missingForFreeShipping(): number {
    return Math.max(0, +(this.freeShippingThreshold - this.subtotal).toFixed(2));
  }

  get total(): number {
    return +(this.subtotal - this.discount + this.shipping).toFixed(2);
  }

  get totalItems(): number {
    return this.items.reduce((acc, i) => acc + i.quantity, 0);
  }

  applyDiscount(): void {
    const code = this.discountCode.trim().toUpperCase();

    if (this.VALID_CODES[code]) {
      this.discountCode = code;
      this.discountPct = this.VALID_CODES[code];
      this.discountApplied = true;
      this.discountError = '';
      this.persistDiscount();
      return;
    }

    this.discountApplied = false;
    this.discountPct = 0;
    this.discountError = 'Código no válido';
    this.clearPersistedDiscount();
  }

  removeDiscount(): void {
    this.discountCode = '';
    this.discountApplied = false;
    this.discountPct = 0;
    this.discountError = '';
    this.clearPersistedDiscount();
  }

  checkout(): void {
    if (this.items.length === 0) return;

    const token = localStorage.getItem('token');
    if (!token) {
      sessionStorage.setItem(this.PENDING_CHECKOUT_KEY, '1');
      this.router.navigate(['/login'], { queryParams: { redirectTo: '/checkout' } });
      return;
    }

    sessionStorage.removeItem(this.PENDING_CHECKOUT_KEY);
    this.router.navigate(['/checkout']);
  }

  private persistDiscount(): void {
    localStorage.setItem(this.CART_DISCOUNT_KEY, JSON.stringify({
      code: this.discountCode,
      pct: this.discountPct
    }));
  }

  private restoreSavedDiscount(): void {
    const raw = localStorage.getItem(this.CART_DISCOUNT_KEY);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw);
      const code = String(saved?.code ?? '').toUpperCase();
      const pct = Number(saved?.pct ?? 0);

      if (!code || !this.VALID_CODES[code] || this.VALID_CODES[code] !== pct) {
        this.clearPersistedDiscount();
        return;
      }

      this.discountCode = code;
      this.discountPct = pct;
      this.discountApplied = true;
      this.discountError = '';
    } catch {
      this.clearPersistedDiscount();
    }
  }

  private clearPersistedDiscount(): void {
    localStorage.removeItem(this.CART_DISCOUNT_KEY);
  }
}
