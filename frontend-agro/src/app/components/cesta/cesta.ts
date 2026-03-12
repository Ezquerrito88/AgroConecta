import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CarritoService } from '../../core/services/carrito';

export interface CartItem {
  id: number;
  name: string;
  farmer: string;
  price: number;
  unit: string;
  quantity: number;
  image?: string;
}

@Component({
  selector: 'app-cesta',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CurrencyPipe, NavbarComponent, FooterComponent],
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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.items = this.carritoService.getItems();
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
    this.loading = true;
    // navegar a /checkout — aquí conectarás con el backend
    setTimeout(() => { this.loading = false; }, 1500);
  }
}
