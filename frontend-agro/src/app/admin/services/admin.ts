import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/admin`;

  // ── Stats ──────────────────────────────────────
  getStats(): Observable<any> {
    return this.http.get(`${this.api}/stats`);
  }

  // ── Usuarios ───────────────────────────────────
  getUsers(params?: any): Observable<any> {
    let p = new HttpParams();
    if (params?.search) p = p.set('search', params.search);
    if (params?.role) p = p.set('role', params.role);
    if (params?.active !== undefined) p = p.set('active', params.active);
    if (params?.page) p = p.set('page', params.page);
    return this.http.get(`${this.api}/users`, { params: p });
  }

  getUser(id: number): Observable<any> {
    return this.http.get(`${this.api}/users/${id}`);
  }

  updateRole(id: number, role: string): Observable<any> {
    return this.http.patch(`${this.api}/users/${id}/role`, { role });
  }

  toggleActive(id: number): Observable<any> {
    return this.http.patch(`${this.api}/users/${id}/toggle`, {});
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.api}/users/${id}`);
  }

  // ── Productos ──────────────────────────────────
  getProducts(params?: any): Observable<any> {
    let p = new HttpParams();
    if (params?.search) p = p.set('search', params.search);
    if (params?.status) p = p.set('status', params.status);
    if (params?.category_id) p = p.set('category_id', params.category_id);
    if (params?.page) p = p.set('page', params.page);
    return this.http.get(`${this.api}/products`, { params: p });
  }

  approveProduct(id: number): Observable<any> {
    return this.http.patch(`${this.api}/products/${id}/approve`, {});
  }

  rejectProduct(id: number): Observable<any> {
    return this.http.patch(`${this.api}/products/${id}/reject`, {});
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.api}/products/${id}`);
  }

  // ── Categorías ─────────────────────────────────
  getCategories(): Observable<any> {
    return this.http.get(`${this.api}/categories`);
  }

  createCategory(data: FormData): Observable<any> {
    return this.http.post(`${this.api}/categories`, data);
  }

  updateCategory(id: number, data: FormData): Observable<any> {
    return this.http.post(`${this.api}/categories/${id}?_method=PUT`, data);
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`${this.api}/categories/${id}`);
  }

  updateUser(id: number, data: any): Observable<any> {
    return this.http.put(`${this.api}/admin/users/${id}`, data);
  }

  // ── Producto por ID ────────────────────────────
  getProductById(id: number): Observable<any> {
    return this.http.get(`${this.api}/products/${id}`);
  }

  updateProduct(id: number, data: any): Observable<any> {
    return this.http.put(`${this.api}/products/${id}`, data);
  }

  uploadProductImages(id: number, formData: FormData): Observable<any> {
    return this.http.post(`${this.api}/products/${id}/images`, formData);
  }

  deleteProductImage(productId: number, imageId: number): Observable<any> {
    return this.http.delete(`${this.api}/products/${productId}/images/${imageId}`);
  }
}