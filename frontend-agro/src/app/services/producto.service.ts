import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Producto } from '../models/producto';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private apiUrl = `${environment.apiUrl}/products`;

  constructor(private http: HttpClient) { }

  // Dashboard: últimos 12 productos, máximo 2 páginas
  getDestacados(page: number = 1, perPage: number = 6): Observable<any> {
    return this.http.get<any>(
      `${environment.apiUrl}/products/latest?page=${page}&per_page=${perPage}`
    );
  }

  // Catálogo completo sin límite de productos
  getCatalogo(filtros: any = {}): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}`, { params: filtros });
  }


  // Obtener todos los productos con filtros
  getProductos(filtros: any = {}): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl, { params: filtros });
  }

  // Obtener un producto por ID
  getProducto(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  // Favoritos (Requiere auth_token via Interceptor)
  toggleFavorite(productId: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/favorites/toggle`, {
      product_id: productId
    });
  }

  // Lista de favoritos del usuario
  getFavoritos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${environment.apiUrl}/favorites`);
  }
}
