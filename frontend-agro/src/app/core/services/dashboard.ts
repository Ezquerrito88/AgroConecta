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
  rating: number;
  sold:   number;
}

export interface DashboardData {
  kpis:          DashboardKpis;
  recent_orders: any[];
  top_products:  TopProduct[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private url = `${environment.apiUrl}/farmer/dashboard`;

  constructor(private http: HttpClient) {}

  getData(): Observable<DashboardData> {
    return this.http.get<DashboardData>(this.url);
  }
}
