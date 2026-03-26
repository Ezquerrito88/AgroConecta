import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth';
import { DashboardService, DashboardKpis, TopProduct } from '../../core/services/dashboard';
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
  today = new Date();

  isLoading = true;
  hasError = false;

  kpis: DashboardKpis = {
    pedidos: 0,
    ventas: 0,
    agotados: 0,
    calificacion: 0
  };

  recentOrders: any[] = [];
  private _topProducts: TopProduct[] = [];

  readonly PLACEHOLDER = 'assets/img/placeholder.jpg';

  statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    processing: 'Procesando',
    shipped: 'En camino',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  };

  statusClasses: Record<string, string> = {
    pending: 'pendiente',
    processing: 'procesando',
    shipped: 'enviado',
    delivered: 'entregado',
    cancelled: 'cancelado',
  };

  statusIcons: Record<string, string> = {
    pending: 'schedule',
    processing: 'sync',
    shipped: 'local_shipping',
    delivered: 'check_circle',
    cancelled: 'cancel',
  };

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadDashboard();
  }

  /** Top 3 productos estrella */
  get topProducts(): TopProduct[] {
    return this._topProducts.slice(0, 3);
  }

  /** Devuelve la imagen real del producto o el placeholder */
  getProductImage(p: TopProduct): string {
    return p?.image || this.PLACEHOLDER;
  }
  
  /** Fallback si la imagen no carga */
  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = this.PLACEHOLDER;
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.hasError = false;

    this.dashboardService.getData().subscribe({
      next: (data) => {
        this.kpis = data.kpis;
        this.recentOrders = data.recent_orders;
        this._topProducts = data.top_products ?? [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.hasError = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
