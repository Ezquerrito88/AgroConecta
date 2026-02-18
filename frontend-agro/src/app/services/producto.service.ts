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

  // Obtener productos destacados (Paginados)
  // Ahora acepta 'page' y opcionalmente 'perPage'
getDestacados(page: number = 1, perPage: number = 6): Observable<any> {
  // Usamos environment.apiUrl directamente para evitar duplicar /products
  const urlBase = environment.apiUrl; 
  return this.http.get<any>(`${urlBase}/products/latest?page=${page}&per_page=${perPage}`);
}

  // Obtener todos los productos con filtros
  getProductos(filtros: any = {}): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl, { params: filtros });
  }

  // Obtener un producto por ID
  getProducto(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  // Lógica de Favoritos (Requiere auth_token via Interceptor)
  toggleFavorite(productId: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/favorites/toggle`, {
      product_id: productId
    });
  }

  // Obtener lista de favoritos del usuario
  getFavoritos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${environment.apiUrl}/favorites`);
  }
}