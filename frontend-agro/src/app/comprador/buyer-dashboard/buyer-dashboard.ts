import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SidebarComprador } from '../sidebar-comprador/sidebar-comprador';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-buyer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyPipe, SidebarComprador],
  templateUrl: './buyer-dashboard.html',
  styleUrl: './buyer-dashboard.css',
})
export class BuyerDashboard implements OnInit {

  kpis = { pedidos: 0, gastado: 0, enCamino: 0, favoritos: 0 };
  recentOrders:    any[] = [];
  favProducts:     any[] = [];
  loadingOrders    = true;
  loadingFavoritos = true;

  user: any = {};
  skeletons = [1, 2, 3, 4, 5];

  statusLabels: Record<string, string> = {
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

  quickActions = [
  { label: 'Explorar catálogo',  icon: 'storefront',      route: '/productos' },
  { label: 'Rastrear pedido',    icon: 'local_shipping',  route: '/comprador/mis-pedidos' },
  { label: 'Dejar valoración',   icon: 'star',            route: '/comprador/valoraciones' },
  { label: 'Contactar vendedor', icon: 'chat_bubble',     route: '/comprador/mensajes' },
];


  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.cargarPedidos();
    this.cargarFavoritos();
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 20) return 'Buenas tardes';
    return 'Buenas noches';
  }

  get firstName(): string {
    return this.user?.name?.split(' ')[0] ?? '';
  }

  cargarPedidos(): void {
    this.http.get<any[]>(`${environment.apiUrl}/buyer/orders`).subscribe({
      next: (orders) => {
        this.recentOrders  = orders.slice(0, 5);
        this.kpis.pedidos  = orders.length;
        this.kpis.enCamino = orders.filter(o => o.status === 'shipped').length;
        this.kpis.gastado  = orders.reduce((acc, o) => acc + Number(o.total), 0);
        this.loadingOrders = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingOrders = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarFavoritos(): void {
    this.http.get<any[]>(`${environment.apiUrl}/favorites`).subscribe({
      next: (products) => {
        this.favProducts      = products.slice(0, 4);
        this.kpis.favoritos   = products.length;
        this.loadingFavoritos = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingFavoritos = false;
        this.cdr.detectChanges();
      }
    });
  }

  getImagen(product: any): string {
    return product?.images?.[0]?.image_url ?? 'img/logo/logo.png';
  }

  getFarmerName(order: any): string {
    return order?.farmer?.name ?? 'Agricultor';
  }

  getProductosLabel(order: any): string {
    if (!order?.items?.length) return '—';
    return order.items.map((i: any) => i.product?.name).filter(Boolean).join(' · ');
  }
}
