import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms'; // ✅ añadido
import { filter } from 'rxjs/operators';
import { CartService } from './services/cart.service';
import { CartDrawer } from './components/cart-drawer/cart-drawer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CartDrawer], // ✅ FormsModule añadido
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {

  isLoggedIn = false;
  mostrarLayout = true;
  isFarmer = false;
  isUserMenuOpen = false;
  currentUser: any = null;

  textoBusquedaGlobal = ''; // ✅ añadido

  constructor(private router: Router, public cartService: CartService) {}

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const rutasOcultas = ['/login', '/registro'];
      this.mostrarLayout = !rutasOcultas.some(ruta => event.urlAfterRedirects.includes(ruta));
      this.isUserMenuOpen = false;
      this.checkLoginStatus();

      // ✅ Limpia el buscador al salir del catálogo
      if (!event.urlAfterRedirects.includes('/productos')) {
        this.textoBusquedaGlobal = '';
      }
    });

    this.checkLoginStatus();
  }

  // ✅ Navega al catálogo con el texto de búsqueda como query param
  buscarDesdeHeader(): void {
    if (this.textoBusquedaGlobal.trim()) {
      this.router.navigate(['/productos'], {
        queryParams: { search: this.textoBusquedaGlobal.trim() }
      });
    }
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }

  checkLoginStatus(): void {
    const token = localStorage.getItem('token');
    this.isLoggedIn = !!token;
    this.isFarmer = false;
    this.currentUser = null;

    if (this.isLoggedIn) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          this.currentUser = JSON.parse(userStr);
          const role = this.currentUser.role;
          if (role === 'agricultor' || role === 'farmer') {
            this.isFarmer = true;
          }
        } catch (error) {
          console.error('Error al leer datos del usuario:', error);
          this.logout();
        }
      }
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
    this.isLoggedIn = false;
    this.isFarmer = false;
    this.currentUser = null;
    this.isUserMenuOpen = false;
    this.router.navigate(['/login']);
  }
}
