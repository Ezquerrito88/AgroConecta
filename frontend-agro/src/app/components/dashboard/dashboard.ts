import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ProductoService } from '../../services/producto.service'; // Asegúrate de que la ruta sea correcta
import { Producto } from '../../models/producto'; // Importamos la interface

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  userRole: string | null = '';
  isLoggedIn: boolean = false;

  productos: Producto[] = [];

  // Variables para la paginación
  paginaActual: number = 1;
  totalPaginas: number = 1;

  constructor(
    private router: Router,
    private productoService: ProductoService
  ) { }

  ngOnInit() {
    const token = localStorage.getItem('auth_token');
    this.isLoggedIn = !!token;
    this.userRole = localStorage.getItem('user_role');

    this.cargarProductos(1); // Iniciamos en la página 1
  }

cargarProductos(page: number) {
  this.productoService.getDestacados(page).subscribe({
    next: (res: any) => {
      // 1. Guardamos SOLO el array de productos para el *ngFor
      this.productos = res.data; 
      
      // 2. Guardamos los números de página para los botones
      this.paginaActual = res.current_page;
      this.totalPaginas = res.last_page;
      
      console.log('¡Éxito! Productos listos para mostrar:', this.productos.length);
    },
    error: (err) => console.error('Error al cargar:', err)
  });
}

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.cargarProductos(nuevaPagina);
      window.scrollTo(0, 500); // Efecto visual para volver arriba
    }
  }

  toggleFavorite(prod: Producto) {
    prod.fav = !prod.fav;
    // Opcional: Si usas OnPush o tienes problemas de refresco
    // this.cdr.detectChanges(); 
    console.log(`Estado de favorito para ${prod.name}: ${prod.fav}`);
  }

  // Añade esto en tu archivo dashboard.ts

  // Método que faltaba y causaba el error TS2339
  irAlCatalogoCompleto() {
    // Por ahora podemos redirigir a la misma página o a una de productos general
    // Esto cumple con el RF08 de búsqueda y filtrado global
    this.router.navigate(['/productos']);
    console.log('Navegando al catálogo completo...');
  }

  // Método para filtrar por categorías (RF08)
  filtrarPorCategoria(id: number | null) {
    this.paginaActual = 1; // Siempre resetear a la página 1 al filtrar
    // Aquí llamarías a tu servicio pasando el category_id
    // Tu backend en el método index() ya está preparado para recibir category_id
    console.log('Filtrando por categoría:', id);
    // Lógica para recargar productos con filtro...
  }

  // ... resto de tus métodos (logout, toggleFavorite)
}