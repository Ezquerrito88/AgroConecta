import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth';
import { OrderService, Order } from '../../core/services/order';
import { Sidebar } from '../sidebar/sidebar';
import { SmartDatePipe } from '../../core/pipes/smart-date-pipe';

@Component({
  selector: 'app-dashboard-agricultor',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyPipe, Sidebar, SmartDatePipe],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
  user: any = null;

  kpis = {
    pedidos: 0,
    ventas: 0,
    agotados: 6,       // esto vendrá de productos más adelante
    calificacion: 4.8  // esto vendrá de reviews más adelante
  };

  recentOrders: Order[] = [];

  topProducts = [
    { name: 'Plátano de Canarias', price: 5.12, rating: 4.5, sold: 130, image: 'https://placehold.co/56x56/f0fdf4/16a34a?text=🍌' },
    { name: 'Tomates Cherry',      price: 4.50, rating: 4.5, sold: 125, image: 'https://placehold.co/56x56/fef2f2/dc2626?text=🍅' },
    { name: 'Cebolla Blanca',      price: 1.50, rating: 4.5, sold: 90,  image: 'https://placehold.co/56x56/fefce8/ca8a04?text=🧅' },
  ];

  statusLabels: Record<string, string> = {
    pending:    'Pendiente',
    processing: 'Procesando',
    shipped:    'En camino',
    delivered:  'Entregado',
    cancelled:  'Cancelado',
  };

  statusClasses: Record<string, string> = {
    pending:    'pendiente',
    processing: 'procesando',
    shipped:    'enviado',
    delivered:  'entregado',
    cancelled:  'cancelado',
  };

  statusIcons: Record<string, string> = {
    pending:    'schedule',
    processing: 'sync',
    shipped:    'local_shipping',
    delivered:  'check_circle',
    cancelled:  'cancel',
  };

  constructor(
    private authService: AuthService,
    private orderService: OrderService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.orderService.getFarmerOrders().subscribe({
      next: (orders) => {
        setTimeout(() => {
          // KPIs reales
          this.kpis.pedidos = orders.length;
          this.kpis.ventas  = orders
            .filter(o => o.status !== 'cancelled')
            .reduce((sum, o) => sum + Number(o.total), 0);

          // Últimos 5 pedidos
          this.recentOrders = orders.slice(0, 5);

          this.cdr.detectChanges();
        }, 0);
      }
    });
  }
}
