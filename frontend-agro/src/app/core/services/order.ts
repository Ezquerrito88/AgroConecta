import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  subtotal: number;
  product: { id: number; name: string; };
}

export interface Order {
  id: number;
  buyer_id: number;
  farmer_id: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  shipping_address: string;
  created_at: string;
  buyer: { id: number; name: string; email: string; };
  items: OrderItem[];
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getFarmerOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.api}/farmer/orders`);
  }

  updateOrderStatus(id: number, status: string): Observable<Order> {
    return this.http.put<Order>(`${this.api}/farmer/orders/${id}/status`, { status });
  }
}
