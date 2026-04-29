import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';


export interface ProductImage {
  id: number;
  product_id: number;
  image_path: string;
  image_url: string;
  order: number;
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  subtotal: number;
  product?: {
    id: number;
    name: string;
    unit?: string;
    category_id?: number;
    price: number;
    first_image?: ProductImage;
  };
}


export interface Order {
  id: number;
  buyer_id: number;
  farmer_id: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  shipping_address: string;
  created_at: string;
  buyer: { id: number; name: string; email: string; profile_photo_url?: string; };
  items: OrderItem[];
}

export interface CreateOrderItemPayload {
  product_id: number;
  quantity: number;
}

export interface CreateOrderPayload {
  items: CreateOrderItemPayload[];
  farmer_id?: number;
  shipping_address?: string;
  discount_code?: string;
  discount_pct?: number;
  payment_method?: 'card' | 'paypal' | 'bizum' | 'cash_on_delivery';
  payment_intent_id?: string;
  payment_transaction_id?: string;
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

  createOrder(payload: CreateOrderPayload): Observable<Order> {
    return this.http.post<Order>(`${this.api}/orders`, payload);
  }

  getBuyerOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.api}/buyer/orders`);
  }
}
