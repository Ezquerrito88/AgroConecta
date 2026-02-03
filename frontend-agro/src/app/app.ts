import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CartDrawer } from './components/cart-drawer/cart-drawer';
import { CartService } from './services/cart.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, CartDrawer],
  templateUrl: './app.html', // Asegúrate de que tu archivo se llama así o app.html
  styleUrls: ['./app.css']
})
export class App implements OnInit { // Nombre estándar: AppComponent
  isLoggedIn: boolean = false; 
  mostrarLayout: boolean = true;
  isFarmer: boolean = false; 

  constructor(private router: Router, public cartService: CartService) {}

  ngOnInit() {
    // Escuchamos cada cambio de URL
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      
      // 1. Ocultar header/footer en Login y Registro
      const rutasOcultas = ['/login', '/registro'];
      this.mostrarLayout = !rutasOcultas.some(ruta => event.urlAfterRedirects.includes(ruta));

      // 2. Comprobar sesión cada vez que cambiamos de página
      this.checkLoginStatus();
    });
  }

  checkLoginStatus() {
    // OJO: Usamos 'auth_token' porque así lo tienes en tu código.
    // Asegúrate de que en el Login lo guardas con ESTE MISMO NOMBRE.
    const token = localStorage.getItem('auth_token');
    
    // Convertimos a booleano real (si hay texto es true, si es null es false)
    this.isLoggedIn = !!token; 

    // Reiniciamos estado
    this.isFarmer = false;

    if (this.isLoggedIn) {
      const userStr = localStorage.getItem('user');

      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          
          // Lógica de roles unificada
          // Si tu base de datos usa role_id: 2 para agricultor, o el string 'farmer'
          if (user.role === 'agricultor' || user.role === 'farmer' || user.role_id === 2) {
            this.isFarmer = true;
          }
        } catch (error) {
          console.error('Error al leer datos del usuario:', error);
          // Si falla el JSON, forzamos logout por seguridad
          this.logout();
        }
      }
    }
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    this.isLoggedIn = false;
    this.isFarmer = false;
    this.router.navigate(['/login']);
  }
}