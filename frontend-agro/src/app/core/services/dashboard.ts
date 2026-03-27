import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardKpis {
  pedidos:      number;
  ventas:       number;
  agotados:     number;
  calificacion: number;
}

export interface TopProduct {
  id:     number;
  name:   string;
  price:  number;
  image:  string;
  unit?:   string;
  rating: number;
  sold:   number;
}

export interface DashboardData {
  kpis:          DashboardKpis;
  recent_orders: any[];
  top_products:  TopProduct[];
}

// ── Statistics types ──────────────────────────────────────────────────────────

export interface StatsSummary {
  total_revenue:  number;
  total_orders:   number;
  total_products: number;
  avg_rating:     number;
  total_reviews:  number;
}

export interface MonthlyRevenue {
  month:   string;
  year:    number;
  revenue: number;
  orders:  number;
}

export interface StatusCount {
  status: string;
  count:  number;
}

export interface StatsTopProduct {
  id:      number;
  name:    string;
  image:   string | null;
  sold:    number;
  revenue: number;
  rating:  number;
  unit:    string;
}

export interface StatisticsData {
  summary:           StatsSummary;
  monthly_revenue:   MonthlyRevenue[];
  orders_by_status:  StatusCount[];
  top_products:      StatsTopProduct[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private dashboardUrl  = `${environment.apiUrl}/farmer/dashboard`;
  private statisticsUrl = `${environment.apiUrl}/farmer/statistics`;

  constructor(private http: HttpClient) {}

  getData(): Observable<DashboardData> {
    return this.http.get<DashboardData>(this.dashboardUrl);
  }

  getStatistics(): Observable<StatisticsData> {
    return this.http.get<StatisticsData>(this.statisticsUrl);
  }
}
