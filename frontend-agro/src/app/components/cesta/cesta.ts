import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CarritoService } from '../../core/services/carrito';
import { CreateOrderPayload, OrderService } from '../../core/services/order';
import { forkJoin } from 'rxjs';

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

  items: CartItem[] = [];
  discountCode   = '';
  discountApplied = false;
  discountPct    = 0;
  discountError  = '';
  loading        = false;

  private readonly VALID_CODES: Record<string, number> = {
    'AGRO10': 10,
    'AGRO20': 20,
    'CAMPO5': 5
  };

  constructor(
    private carritoService: CarritoService,
    private orderService: OrderService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.items = this.carritoService.getItems();
    this.carritoService.items$.subscribe(items => {
      this.items = items;
    });
  }

  // ── Cantidades ──────────────────────────────────────────
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

  trackById(_: number, item: CartItem): number {
    return item.id;
  }

  // ── Totales ─────────────────────────────────────────────
  get subtotal(): number {
    return this.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  }

  get discount(): number {
    return this.discountApplied ? +(this.subtotal * this.discountPct / 100).toFixed(2) : 0;
  }

  get total(): number {
    return +(this.subtotal - this.discount).toFixed(2);
  }

  get totalItems(): number {
    return this.items.reduce((acc, i) => acc + i.quantity, 0);
  }

  // ── Descuento ───────────────────────────────────────────
  applyDiscount(): void {
    const code = this.discountCode.trim().toUpperCase();
    if (this.VALID_CODES[code]) {
      this.discountPct     = this.VALID_CODES[code];
      this.discountApplied = true;
      this.discountError   = '';
    } else {
      this.discountApplied = false;
      this.discountPct     = 0;
      this.discountError   = 'Código no válido';
    }
  }

  removeDiscount(): void {
    this.discountCode    = '';
    this.discountApplied = false;
    this.discountPct     = 0;
    this.discountError   = '';
  }

  // ── Checkout ────────────────────────────────────────────
  checkout(): void {
    if (this.items.length === 0) return;

    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const ordersByFarmer = new Map<number, CreateOrderPayload>();

    for (const item of this.items) {
      if (!item.farmerId) {
        console.error('Producto sin farmerId en el carrito', item);
        return;
      }

      const existing = ordersByFarmer.get(item.farmerId) ?? {
        farmer_id: item.farmerId,
        items: []
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
      next: () => {
        this.carritoService.clear();
        this.loading = false;
        this.cdr.detectChanges();
        alert('Pedido realizado correctamente.');
      },
      error: (error) => {
        this.loading = false;
        this.cdr.detectChanges();
        const message = error?.error?.message || 'No se pudo tramitar el pedido.';
        alert(message);
      }
    });
  }
}
