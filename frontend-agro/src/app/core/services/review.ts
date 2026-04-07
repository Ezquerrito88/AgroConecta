import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReviewPendiente {
  order_id: number;
  product_id: number;
  product: {
    id: number;
    name: string;
    price: number;
    unit: string;
    images: any[];
  };
}

export interface Review {
  id: number;
  product_id: number;
  rating: number;
  comment: string;
  created_at: string;
  product: any;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getPendientes(): Observable<ReviewPendiente[]> {
    return this.http.get<ReviewPendiente[]>(`${this.api}/reviews/pendientes`);
  }

  getMisReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.api}/reviews/mis-reviews`);
  }

  store(data: { product_id: number; rating: number; comment: string }): Observable<Review> {
    return this.http.post<Review>(`${this.api}/reviews`, data);
  }
}