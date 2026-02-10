import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CartService } from './services/cart.service';
import { CartDrawer } from './components/cart-drawer/cart-drawer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, CartDrawer], 
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit { // Mejor usar AppComponent

  // Variables de estado
  isLoggedIn: boolean = false;
  mostrarLayout: boolean = true;
  isFarmer: boolean = false;

  isUserMenuOpen: boolean = false;
  currentUser: any = null;

  constructor(private router: Router, public cartService: CartService) { }

  ngOnInit() {
    // Escuchamos cada cambio de URL
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {

      // 1. Ocultar header/footer en Login y Registro
      const rutasOcultas = ['/login', '/registro'];
      // Solo ocultamos si la URL exacta está en la lista (evita ocultar en subrutas si no quieres)
      this.mostrarLayout = !rutasOcultas.some(ruta => event.urlAfterRedirects.includes(ruta));

      // 2. Cerrar el menú si cambiamos de página
      this.isUserMenuOpen = false;

      // 3. Comprobar sesión
      this.checkLoginStatus();
    });

    // Comprobación inicial
    this.checkLoginStatus();
  }

  // --- LÓGICA DEL MENÚ DESPLEGABLE ---
  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu() {
    this.isUserMenuOpen = false;
  }

  // --- LÓGICA DE SESIÓN ---
  checkLoginStatus() {
    // NOTA: En el Registro usamos la clave 'token', asegúrate de usar la misma aquí.
    const token = localStorage.getItem('token');

    this.isLoggedIn = !!token; // true si hay token, false si no

    // Reiniciamos estado
    this.isFarmer = false;
    this.currentUser = null;

    if (this.isLoggedIn) {
      // Intentamos recuperar los datos del usuario
      const userStr = localStorage.getItem('user'); // Asegúrate de guardar esto en el Login/Registro

      if (userStr) {
        try {
          this.currentUser = JSON.parse(userStr);

          // Lógica de roles: Miramos si el rol es 'farmer' o 'agricultor'
          const role = this.currentUser.role;
          if (role === 'agricultor' || role === 'farmer') {
            this.isFarmer = true;
          }
        } catch (error) {
          console.error('Error al leer datos del usuario:', error);
          this.logout(); // Si los datos están corruptos, cerramos sesión
        }
      }
    }
  }

  logout() {
    // Borramos todo
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');

    // Reseteamos variables
    this.isLoggedIn = false;
    this.isFarmer = false;
    this.currentUser = null;
    this.isUserMenuOpen = false;

    // Redirigimos al login
    this.router.navigate(['/login']);
  }
}