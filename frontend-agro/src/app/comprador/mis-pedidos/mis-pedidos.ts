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

  orders: any[]         = [];
  filteredOrders: any[] = [];
  loading               = true;
  filtroActivo          = 'todos';

  filtros = [
    { id: 'todos',     label: 'Todos' },
    { id: 'pending',   label: 'Pendientes' },
    { id: 'shipped',   label: 'En camino' },
    { id: 'delivered', label: 'Entregados' },
    { id: 'cancelled', label: 'Cancelados' },
  ];

  statusLabels:  Record<string, string> = {
    pending:    'Pendiente',
    processing: 'Procesando',
    shipped:    'En camino',
    delivered:  'Entregado',
    cancelled:  'Cancelado',
  };
  statusClasses: Record<string, string> = {
    pending:    'status-pending',
    processing: 'status-pending',
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

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.http.get<any[]>(`${environment.apiUrl}/buyer/orders`).subscribe({
      next: (orders) => {
        this.orders         = orders;
        this.filteredOrders = orders;
        this.loading        = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('ERROR:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  setFiltro(id: string): void {
    this.filtroActivo   = id;
    this.filteredOrders = id === 'todos'
      ? this.orders
      : this.orders.filter(o => o.status === id);
  }

  getProductosLabel(order: any): string {
    if (!order?.items?.length) return '—';
    return order.items.map((i: any) => i.product?.name).filter(Boolean).join(' · ');
  }

  getFarmerName(order: any): string {
    return order?.farmer?.name ?? 'Agricultor';
  }
  expandedId: number | null = null;

toggleExpand(id: number): void {
  this.expandedId = this.expandedId === id ? null : id;
}

getCount(filtroId: string): number {
  if (filtroId === 'todos') return this.orders.length;
  return this.orders.filter(o => o.status === filtroId).length;
}

}
