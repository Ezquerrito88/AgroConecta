import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// --- IMPORTS DE ANGULAR MATERIAL ---
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatSliderModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  // Asegúrate de que estos nombres coinciden con tus archivos reales
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css'
})
export class Catalogo implements OnInit {
  // Datos principales
  productos: Producto[] = [];

  // Paginación
  paginaActual: number = 1;
  totalPaginas: number = 1;
  totalProductos: number = 0;
  desde: number = 0;
  hasta: number = 0;

  // --- VARIABLES DE FILTROS ---
  filtroCategoria: string = 'Todas';
  filtroUbicacion: string = 'Todas';

  // Slider de Rango de Precio
  minPrice: number = 0;
  maxPrice: number = 100;

  constructor(
    private productoService: ProductoService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.cargarProductos(1);
  }

  cargarProductos(page: number): void {
    // Pedimos 12 productos por página
    this.productoService.getDestacados(page, 12).subscribe({
      next: (res: any) => {
        this.productos = res.data;
        this.paginaActual = res.current_page;
        this.totalPaginas = res.last_page;

        // Datos para "Mostrando X-Y de Z productos"
        this.totalProductos = res.total;
        this.desde = res.from;
        this.hasta = res.to;

        this.cdr.detectChanges();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => console.error('Error:', err)
    });
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.cargarProductos(nuevaPagina);
    }
  }

  /**
   * PAGINACIÓN INTELIGENTE (Ventana deslizante)
   * Soluciona el problema de tener 100 botones.
   * Muestra máximo 5 botones alrededor de la página actual.
   */
  get numeracionPaginas(): number[] {
    const total = this.totalPaginas;
    const current = this.paginaActual;
    const maxVisible = 5; // Número máximo de botones a mostrar

    // 1. Si hay pocas páginas, las mostramos todas
    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    // 2. Calculamos el rango (2 atrás y 2 delante)
    let start = current - 2;
    let end = current + 2;

    // 3. Ajuste si estamos al principio (ej: pág 1)
    if (start < 1) {
      start = 1;
      end = maxVisible;
    }

    // 4. Ajuste si estamos al final (ej: pág 100)
    if (end > total) {
      end = total;
      start = total - maxVisible + 1;
    }

    // 5. Generamos el array
    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  formatLabel(value: number): string {
    return value >= 1000 ? Math.round(value / 1000) + 'k' : `${value}€`;
  }

  filtrarPorPrecio() {
    console.log(`Filtrando precio entre: ${this.minPrice}€ y ${this.maxPrice}€`);
    // Aquí puedes llamar a this.cargarProductos(1) si implementas el filtro en el back
  }

  toggleFavorite(prod: Producto) {
    // Usamos el nuevo nombre 'is_favorite'
    prod.is_favorite = !prod.is_favorite;

    this.productoService.toggleFavorite(prod.id).subscribe({
      next: (res: any) => console.log('Like guardado'),
      error: (err) => {
        // Si falla, revertimos usando el nombre nuevo
        prod.is_favorite = !prod.is_favorite;
        console.error(err);
      }
    });
  }

  agregarAlCarrito(prod: Producto) {
    console.log('Añadiendo:', prod.name);
  }
}