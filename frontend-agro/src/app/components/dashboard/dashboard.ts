import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // Añadido ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto';
import { FormsModule } from '@angular/forms'; // <--- Necesario
import { MatSliderModule } from '@angular/material/slider'; // <--- Necesario

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatSliderModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  productos: Producto[] = [];
  paginaActual: number = 1;
  totalPaginas: number = 1;
  minPrice: number = 0;
  maxPrice: number = 100;

  constructor(
    private router: Router,
    private productoService: ProductoService,
    private cdr: ChangeDetectorRef // Inyectamos el detector de cambios
  ) { }

  ngOnInit() {
    this.cargarProductos(1);
  }

  cargarProductos(page: number) {
    this.productoService.getDestacados(page).subscribe({
      next: (res: any) => {
        this.productos = res.data;
        this.paginaActual = res.current_page;
        this.totalPaginas = res.last_page;

        // ¡ESTO ELIMINA EL DOBLE CLIC! 
        // Obliga a la pantalla a refrescarse con los nuevos datos inmediatamente
        this.cdr.detectChanges();

        console.log('Productos cargados:', this.productos.length);
      },
      error: (err: any) => console.error('Error:', err)
    });
  }

  // Asegúrate de tener solo UNA implementación de esta función
  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina === this.paginaActual || nuevaPagina < 1 || nuevaPagina > this.totalPaginas) {
      return;
    }

    this.productoService.getDestacados(nuevaPagina).subscribe({
      next: (res: any) => {
        // Usamos el spread operator para asegurar que Angular detecte el cambio
        this.productos = [...res.data];
        this.paginaActual = res.current_page;
        this.totalPaginas = res.last_page;

        // Forzamos la detección de cambios para que funcione al primer clic
        this.cdr.detectChanges();

        window.scrollTo({ top: 450, behavior: 'smooth' });
        console.log('Página actualizada con éxito:', this.paginaActual);
      },
      error: (err: any) => console.error('Error al cambiar página:', err)
    });
  }

  toggleFavorite(prod: Producto) {
    prod.fav = !prod.fav;
    this.cdr.detectChanges(); // Refresca el corazón al instante
  }

  irAlCatalogoCompleto() {
    this.router.navigate(['/productos']);
  }

  formatLabel(value: number): string {
    return value + '€';
  }

  filtrarPorPrecio() {
    console.log(`Filtrando precios: ${this.minPrice}€ - ${this.maxPrice}€`);
    // Aquí podrías llamar a this.cargarProductos(1) si el backend soportara filtros
    this.cdr.detectChanges();
  }
}