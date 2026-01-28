import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App implements OnInit {
  isLoggedIn: boolean = false; 
  mostrarLayout: boolean = true;
  
  // NUEVA VARIABLE: Para saber si mostramos el tractor o la persona
  isFarmer: boolean = false; 

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      
      // 1. Control de visibilidad del Layout (Ocultar en login)
      this.mostrarLayout = !event.urlAfterRedirects.includes('/login');

      // 2. Control de sesión y Rol
      this.checkLoginStatus();
    });
  }

  checkLoginStatus() {
    const token = localStorage.getItem('auth_token');
    this.isLoggedIn = !!token; 

    // Reiniciamos el estado de agricultor por seguridad
    this.isFarmer = false;

    if (this.isLoggedIn) {
      // Recuperamos los datos del usuario guardados al hacer login
      // Asegúrate de que en tu login.ts guardaste: localStorage.setItem('user', JSON.stringify(res.user));
      const userStr = localStorage.getItem('user');

      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          
          // COMPROBACIÓN DEL ROL
          // Cambia 'agricultor' o 'role_id' según cómo venga de tu base de datos (Laravel)
          if (user.role === 'agricultor' || user.role_id === 2 || user.tipo === 'farmer') {
            this.isFarmer = true;
          }
        } catch (error) {
          console.error('Error al leer datos del usuario', error);
        }
      }
    }
  }
}