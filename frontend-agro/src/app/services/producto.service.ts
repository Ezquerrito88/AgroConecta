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
  private apiURL = 'http://127.0.0.1:8000/api/products/featured';

  getDestacados(page: number = 1): Observable<any> {
    // Laravel detecta automáticamente el parámetro 'page' para el método paginate()
    return this.http.get<any>(`${this.apiURL}?page=${page}`);
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
}

