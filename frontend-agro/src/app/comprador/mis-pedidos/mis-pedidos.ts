import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SidebarComprador } from '../sidebar-comprador/sidebar-comprador';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyPipe, SidebarComprador],
  templateUrl: './mis-pedidos.html',
  styleUrl: './mis-pedidos.css'
})
export class MisPedidos implements OnInit {

  user: any = {};
  orders:         any[] = [];
  filteredOrders: any[] = [];
  loading               = true;
  filtroActivo          = 'todos';
  expandedId:     number | null = null;

  pageSize    = 10;
  currentPage = 1;

  filtros = [
    { id: 'todos',      label: 'Todos' },
    { id: 'pending',    label: 'Pendientes' },
    { id: 'processing', label: 'Procesando' },
    { id: 'shipped',    label: 'En camino' },
    { id: 'delivered',  label: 'Entregados' },
    { id: 'cancelled',  label: 'Cancelados' },
  ];

  statusLabels: Record<string, string> = {
    pending:    'Pendiente',
    processing: 'Procesando',
    shipped:    'En camino',
    delivered:  'Entregado',
    cancelled:  'Cancelado',
  };

  statusClasses: Record<string, string> = {
    pending:    'status-pending',
    processing: 'status-processing',
    shipped:    'status-shipped',
    delivered:  'status-delivered',
    cancelled:  'status-cancelled',
  };

  statusIcons: Record<string, string> = {
    pending:    'schedule',
    processing: 'autorenew',
    shipped:    'local_shipping',
    delivered:  'check_circle',
    cancelled:  'cancel',
  };

  get firstName(): string {
    return this.user?.name?.split(' ')[0] ?? '';
  }

  get userInitial(): string {
    return this.firstName.charAt(0).toUpperCase();
  }

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');

    this.http.get<any[]>(`${environment.apiUrl}/buyer/orders`).subscribe({
      next: (orders) => {
        this.orders         = orders;
        this.filteredOrders = orders;
        this.loading        = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('ERROR cargando pedidos:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /* ── Filtrado ── */
  setFiltro(id: string): void {
    this.filtroActivo   = id;
    this.currentPage    = 1;
    this.expandedId     = null;
    this.filteredOrders = id === 'todos'
      ? this.orders
      : this.orders.filter(o => o.status === id);
  }

  getCount(filtroId: string): number {
    if (filtroId === 'todos') return this.orders.length;
    return this.orders.filter(o => o.status === filtroId).length;
  }

  /* ── Paginación ── */
  get pagedOrders(): any[] {
    return this.filteredOrders.slice(0, this.currentPage * this.pageSize);
  }

  get hasMore(): boolean {
    return this.currentPage * this.pageSize < this.filteredOrders.length;
  }

  get remaining(): number {
    const rest = this.filteredOrders.length - this.currentPage * this.pageSize;
    return rest > this.pageSize ? this.pageSize : rest;
  }

  cargarMas(): void {
    this.currentPage++;
  }

  /* ── Expand ── */
  toggleExpand(id: number): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  /* ── Helpers ── */
  getProductosLabel(order: any): string {
    if (!order?.items?.length) return '—';
    return order.items
      .map((i: any) => i.product?.name)
      .filter(Boolean)
      .join(' · ');
  }

  getFarmerName(order: any): string {
    return order?.farmer?.name ?? 'Agricultor';
  }
}