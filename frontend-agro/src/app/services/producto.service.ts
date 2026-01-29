import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Producto } from '../models/producto'; // Esto importa el "molde" de datos

@Injectable({
  providedIn: 'root',
})
export class ProductoService {
  constructor(private http: HttpClient) { }
  // Esta URL debe coincidir con tu servidor de Laravel (típicamente puerto 8000)
  // Asegúrate de que termina en /trending como pusiste en Laravel
  // Si en Laravel la ruta es Route::get('/products/featured', ...)
  private apiURL = 'http://127.0.0.1:8000/api';

  // En producto.service.ts
  getDestacados(page: number, limit: number = 6) {
    // 2. Aquí concatenamos una sola vez la ruta
    return this.http.get(`${this.apiURL}/products/featured?page=${page}&limit=${limit}`);
  }


  // Obtener TODOS los productos (con filtros opcionales)
  getAllProducts(page: number = 1, filters: any = {}) {
    // Construimos los parámetros para enviar a Laravel
    let params: any = { page: page };

    if (filters.categoria) params.category_id = filters.categoria;
    if (filters.minPrice) params.min_price = filters.minPrice;
    if (filters.maxPrice) params.max_price = filters.maxPrice;
    if (filters.search) params.search = filters.search;
    if (filters.sort) params.sort_by = filters.sort;

    return this.http.get<any>(`${this.apiURL}/products`, { params });
  }

  // Función para dar/quitar like
  toggleFavorite(id: number) {
    // Llamamos a la ruta que acabamos de crear en Laravel
    return this.http.post(`${this.apiURL}/favorites/${id}`, {});
  }
}

