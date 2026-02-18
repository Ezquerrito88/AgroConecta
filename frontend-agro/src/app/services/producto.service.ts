import { Injectable, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  // URL de tu backend Laravel
  private apiUrl = 'https://agroconecta-backend-v2-bxbxfudaatbmgxdg.spaincentral-01.azurewebsites.net/api';

  constructor(private http: HttpClient) { }

<<<<<<< HEAD
  // --- 1. PRODUCTOS DESTACADOS (Para solucionar tu error actual) ---
  getDestacados(page: number = 1, limit: number = 6): Observable<any> {
    // Llama al endpoint /products/featured con paginación
    return this.http.get<any>(`${this.apiUrl}/products/featured?page=${page}&limit=${limit}`);
  }

  // --- 2. FAVORITOS (Para la sección de favoritos) ---
  getFavoritos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/favorites`);
=======
  // 1. Obtener categorías para filtros
  getCategorias(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categories`);
  }

  // 2. Obtener productos filtrados (Catálogo Completo)
  getProductosFiltrados(filtros: any): Observable<any> {
    let params = new HttpParams()
      .set('page', filtros.page.toString())
      .set('limit', filtros.limit.toString())
      .set('per_page', filtros.limit.toString());

    if (filtros.category_id && filtros.category_id !== 'Todas') {
      params = params.set('category_id', filtros.category_id.toString());
    }

    if (filtros.min_price) params = params.set('min_price', filtros.min_price.toString());
    if (filtros.max_price) params = params.set('max_price', filtros.max_price.toString());

    params = params.set('sort', 'latest');

    return this.http.get<any>(`${this.apiUrl}/products`, { params });
  }

  // 3. Obtener productos destacados (Dashboard - SOLO LOS 12 ÚLTIMOS)
  getDestacados(page: number = 1): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/products/latest?page=${page}`);
  }

  // 4. Gestión de Favoritos
  toggleFavorite(productId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/favorites/toggle`, { product_id: productId });
>>>>>>> 1af9321 (feat: implementar diseño premium de cards y corregir error 401 en favoritos)
  }

  toggleFavorite(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/favorites/${id}`, {});
  }

  // --- 3. OTROS MÉTODOS ÚTILES ---
  getProductos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/products`);
  }
  
  getProductoById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/products/${id}`);
  }
}