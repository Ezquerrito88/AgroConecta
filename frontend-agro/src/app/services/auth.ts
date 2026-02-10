import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // Asegúrate de que esta URL coincide con la de tu Laravel (comando: php artisan serve)
  private apiUrl = 'http://localhost:8000/api'; 

  constructor(private http: HttpClient) { }

  // 👇 ESTA ES LA FUNCIÓN QUE TE FALTABA
  register(userData: any): Observable<any> {
    // Envía los datos a http://localhost:8000/api/register
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  // Seguramente necesites también la del Login
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }
  
  // Y la de cerrar sesión
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
  }
}