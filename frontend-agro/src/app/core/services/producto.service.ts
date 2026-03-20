import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Producto } from '../models/producto';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private apiUrl        = `${environment.apiUrl}/products`;
  private adminUrl      = `${environment.apiUrl}/admin`;
  private favoritesUrl  = `${environment.apiUrl}/favorites`;
  private farmerUrl     = `${environment.apiUrl}/farmer`;

  constructor(private http: HttpClient) {}

  // ─── PÚBLICOS ───────────────────────────────────────────────

  getDestacados(page = 1, perPage = 6, filtros: any = {}): Observable<any> {
    const params = { page, per_page: perPage, ...filtros };
    return this.http.get<any>(`${this.apiUrl}/latest`, { params });
  }

  getCatalogo(filtros: any = {}): Observable<any> {
    return this.http.get<any>(this.apiUrl, { params: filtros });
  }

  getProductos(filtros: any = {}): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl, { params: filtros });
  }

  getProducto(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  // ─── AGRICULTOR ─────────────────────────────────────────────

  getMisProductos(page = 1, perPage = 12): Observable<any> {
    return this.http.get<any>(`${this.farmerUrl}/products`, {
      params: { page, per_page: perPage }
    });
  }

  createProducto(formData: FormData): Observable<any> {
    return this.http.post(this.apiUrl, formData);
  }

  updateProducto(id: number, formData: FormData): Observable<any> {
    formData.append('_method', 'PUT');
    return this.http.post(`${this.apiUrl}/${id}`, formData);
  }

  deleteProducto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  deleteImage(productId: number, imageId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${productId}/images/${imageId}`);
  }

  // ─── FAVORITOS ──────────────────────────────────────────────

  toggleFavorite(productId: number): Observable<any> {
    return this.http.post(`${this.favoritesUrl}/${productId}`, {});
  }

  getFavoritos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.favoritesUrl);
  }

  // ─── ADMIN ──────────────────────────────────────────────────

  // Categorías (antes sin prefijo /admin ⚠️)
  createCategoria(data: any): Observable<any> {
    return this.http.post(`${this.adminUrl}/categories`, data);
  }

  updateCategoria(id: number, data: any): Observable<any> {
    return this.http.put(`${this.adminUrl}/categories/${id}`, data);
  }

  deleteCategoria(id: number): Observable<any> {
    return this.http.delete(`${this.adminUrl}/categories/${id}`);
  }

  // Moderación de productos
  getProductosPendientes(): Observable<any> {
    return this.http.get(`${this.adminUrl}/products`);
  }

  aprobarProducto(id: number): Observable<any> {
    return this.http.put(`${this.adminUrl}/products/${id}/approve`, {});
  }

  rechazarProducto(id: number): Observable<any> {
    return this.http.put(`${this.adminUrl}/products/${id}/reject`, {});
  }
}
