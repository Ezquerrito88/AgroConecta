import { Injectable, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  // URL de tu backend Laravel
  private apiUrl = isDevMode() ? 'http://localhost:8000/api' 
  : 'https://agroconecta-backend-v2-bxbxfudaatbmgxdg.spaincentral-01.azurewebsites.net/api'; 

  constructor(private http: HttpClient) { }

  // --- 1. PRODUCTOS DESTACADOS (Para solucionar tu error actual) ---
  getDestacados(page: number = 1, limit: number = 6): Observable<any> {
    // Llama al endpoint /products/featured con paginación
    return this.http.get<any>(`${this.apiUrl}/products/featured?page=${page}&limit=${limit}`);
  }

  // --- 2. FAVORITOS (Para la sección de favoritos) ---
  getFavoritos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/favorites`);
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