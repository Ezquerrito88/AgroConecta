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
}

// Cambiamos /productos por /products/featured (o como lo hayas puesto en api.php)


