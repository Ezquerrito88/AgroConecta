import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Producto } from '../models/producto';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  private apiUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) { }

  // 1. CATEGORÍAS
  getCategorias(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categories`);
  }

  // 2. CATÁLOGO COMPLETO
  getProductosFiltrados(filtros: any): Observable<any> {
    let params = new HttpParams()
      .set('page', filtros.page.toString())
      .set('limit', filtros.limit.toString())
      .set('per_page', filtros.limit.toString());

    if (filtros.category_id && filtros.category_id !== 'Todas') {
      params = params.set('category_id', filtros.category_id.toString());
    }
    return this.http.get<any>(`${this.apiUrl}/products`, { params });
  }

  // 3. DASHBOARD (Forzamos 6 productos por página)
  getDestacados(page: number = 1, limit: number = 6): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/products?page=${page}&limit=${limit}&per_page=${limit}`);
  }

  toggleFavorite(productId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/favorites/toggle`, { product_id: productId });
  }

  getFavoritos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/favorites`);
  }
}