import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Producto } from '../models/producto';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) { }

  // Dashboard: acepta filtros opcionales
  getDestacados(page: number = 1, perPage: number = 6, filtros: any = {}): Observable<any> {
    const params: any = { page, per_page: perPage, ...filtros };
    return this.http.get<any>(`${this.apiUrl}/latest`, { params });
  }


  // Catálogo completo
  getCatalogo(filtros: any = {}): Observable<any> {
    return this.http.get<any>(this.apiUrl, { params: filtros });
  }

  getProductos(filtros: any = {}): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl, { params: filtros });
  }

  getProducto(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  toggleFavorite(productId: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/favorites/toggle`, { product_id: productId });
  }

  getFavoritos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${environment.apiUrl}/favorites`);
  }
}
