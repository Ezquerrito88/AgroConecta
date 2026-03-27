import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService, StatisticsData, StatsSummary, MonthlyRevenue, StatusCount, StatsTopProduct } from '../../core/services/dashboard';
import { Sidebar } from '../sidebar/sidebar';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyPipe, Sidebar],
  templateUrl: './estadisticas.html',
  styleUrl: './estadisticas.css',
})
export class Estadisticas implements OnInit {

  user: any = null;
  isLoading = true;
  hasError  = false;

  summary: StatsSummary = {
    total_revenue:  0,
    total_orders:   0,
    total_products: 0,
    avg_rating:     0,
    total_reviews:  0,
  };

  monthlyRevenue: MonthlyRevenue[]  = [];
  ordersByStatus: StatusCount[]     = [];
  topProducts:    StatsTopProduct[] = [];

  readonly PLACEHOLDER = 'assets/img/placeholder.jpg';

  /** Heights (%) for the 6 skeleton bars in the revenue chart */
  readonly skeletonBarHeights = [40, 60, 35, 80, 55, 70];

  statusLabels: Record<string, string> = {
    pending:    'Pendiente',
    processing: 'Procesando',
    shipped:    'En camino',
    delivered:  'Entregado',
    cancelled:  'Cancelado',
  };

  statusColors: Record<string, string> = {
    pending:    '#f59e0b',
    processing: '#3b82f6',
    shipped:    '#8b5cf6',
    delivered:  '#10b981',
    cancelled:  '#ef4444',
  };

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadStatistics();
  }

  loadStatistics(): void {
    this.isLoading = true;
    this.hasError  = false;

    this.dashboardService.getStatistics().subscribe({
      next: (data: StatisticsData) => {
        this.summary        = data.summary;
        this.monthlyRevenue = data.monthly_revenue  ?? [];
        this.ordersByStatus = data.orders_by_status ?? [];
        this.topProducts    = data.top_products     ?? [];
        this.isLoading      = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.hasError  = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  /** Max revenue value used to scale the bar chart */
  get maxRevenue(): number {
    const max = Math.max(...this.monthlyRevenue.map(m => m.revenue), 1);
    return max;
  }

  /** Height percentage for a monthly bar */
  barHeight(revenue: number): number {
    if (this.maxRevenue === 0) return 0;
    return Math.round((revenue / this.maxRevenue) * 100);
  }

  /** Total orders for status percentage calculation */
  get totalOrderCount(): number {
    return this.ordersByStatus.reduce((sum, s) => sum + s.count, 0) || 1;
  }

  statusPercent(count: number): number {
    return Math.round((count / this.totalOrderCount) * 100);
  }

  getStatusLabel(status: string): string {
    return this.statusLabels[status] ?? status;
  }

  getStatusColor(status: string): string {
    return this.statusColors[status] ?? '#6b7280';
  }

  getProductImage(p: StatsTopProduct): string {
    return p?.image || this.PLACEHOLDER;
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = this.PLACEHOLDER;
  }

  /** Stars array for rating display */
  starsArray(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i);
  }

  isStarFilled(index: number, rating: number): boolean {
    return index < Math.round(rating);
  }
}
