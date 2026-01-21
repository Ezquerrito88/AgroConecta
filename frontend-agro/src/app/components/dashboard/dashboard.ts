import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router'; // Añadimos RouterModule para el routerLink

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule], // Importante añadir RouterModule aquí
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  userRole: string | null = '';
  isLoggedIn: boolean = false; // Variable para controlar la vista en el HTML

  constructor(private router: Router) {}

  ngOnInit() {
    // 1. Verificamos si existe un token
    const token = localStorage.getItem('auth_token');
    this.isLoggedIn = !!token; // Si hay token, isLoggedIn es true

    // 2. Recuperamos el rol (farmer o buyer)
    this.userRole = localStorage.getItem('user_role');

    // Nota: Eliminamos la redirección forzosa al login porque ahora
    // el Dashboard es tu página principal y debe ser visible aunque no estés logueado.
  }

  logout() {
    localStorage.clear(); // Limpiamos sesión
    this.isLoggedIn = false;
    this.userRole = '';
    // Redirigimos al login o simplemente refrescamos la página principal
    this.router.navigate(['/']).then(() => {
      window.location.reload(); 
    });
  }
}