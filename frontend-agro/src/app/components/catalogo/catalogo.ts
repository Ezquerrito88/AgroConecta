import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css'
})
export class Catalogo implements OnInit {

  productos: Producto[] = [];

  paginaActual = 1;
  totalPaginas = 1;
  totalProductos = 0;
  desde = 0;
  hasta = 0;

  filtroCategoria = 'Todas';
  filtroUbicacion = 'Todas';
  minPrice = 0;
  maxPrice = 100;

  constructor(
    private productoService: ProductoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarProductos(1);
  }

  /** Fetches a paginated page of products from the API. */
  cargarProductos(page: number): void {
    this.productoService.getCatalogo(page, 12).subscribe({
      next: (res: any) => {
        this.productos      = res.data ?? [];
        this.paginaActual   = res.current_page;
        this.totalPaginas   = res.last_page;
        this.totalProductos = res.total;
        this.desde          = res.from;
        this.hasta          = res.to;
        this.cdr.detectChanges();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => console.error('Error loading products:', err)
    });
  }

  /** Navigates to the given page if within valid bounds. */
  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.cargarProductos(nuevaPagina);
    }
  }

  /**
   * Returns a sliding window of up to 5 page numbers centered
   * around the current page, clamped to [1, totalPaginas].
   */
  get numeracionPaginas(): number[] {
    const maxVisible = 5;

    if (this.totalPaginas <= maxVisible) {
      return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
    }

    let start = this.paginaActual - 2;
    let end   = this.paginaActual + 2;

    if (start < 1) { start = 1; end = maxVisible; }
    if (end > this.totalPaginas) { end = this.totalPaginas; start = end - maxVisible + 1; }

    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  /** Formats slider tick labels (e.g. 1000 → "1k", 50 → "50€"). */
  formatLabel(value: number): string {
    return value >= 1000 ? `${Math.round(value / 1000)}k` : `${value}€`;
  }

  /** Reloads the catalogue from page 1 applying the current price range. */
  filtrarPorPrecio(): void {
    this.cargarProductos(1);
  }

  /** Optimistically toggles the favourite state, reverting on API error. */
  toggleFavorite(prod: Producto): void {
    prod.is_favorite = !prod.is_favorite;
    this.productoService.toggleFavorite(prod.id).subscribe({
      error: (err) => {
        prod.is_favorite = !prod.is_favorite;
        console.error('Failed to update favourite:', err);
      }
    });
  }

  agregarAlCarrito(prod: Producto): void {
    console.log('Adding to cart:', prod.name);
  }
}
