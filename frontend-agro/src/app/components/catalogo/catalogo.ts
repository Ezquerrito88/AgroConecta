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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// --- SERVICIOS Y MODELOS ---
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto';
import { environment } from '../../../environments/environment';

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
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css'
})
export class Catalogo implements OnInit {
  
  // URL dinámica del entorno actual
  private readonly API_URL = environment.apiUrl;

  // Datos principales
  productos: Producto[] = [];
  categorias: any[] = [];
  isLoading: boolean = true;

  // Paginación
  paginaActual: number = 1;
  totalPaginas: number = 1;
  totalProductos: number = 0;
  desde: number = 0;
  hasta: number = 0;

  // --- VARIABLES DE FILTROS ---
  filtroCategoria: any = 'Todas';
  minPrice: number = 0;
  maxPrice: number = 100;

  constructor(
    private productoService: ProductoService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarProductos(1);
  }

  // 👇 GESTIÓN DE IMÁGENES HÍBRIDA
  getImagenUrl(prod: any): string {
    if (prod.images && prod.images.length > 0) {
      const path = prod.images[0].image_path;
      
      // Limpiamos URLs absolutas que vengan de la DB para que coincidan con el entorno actual
      if (path.startsWith('http')) {
        return path.replace(/http:\/\/127\.0\.0\.1:8000|https:\/\/agroconecta-backend-v2-.*\.azurewebsites\.net/g, this.API_URL);
      }
      
      return `${this.API_URL}/storage/${path}`;
    }
    return 'assets/placeholder.png';
  }

  cargarCategorias(): void {
    // Asumimos que tienes este método en tu servicio para llenar el select
    this.productoService.getCategorias().subscribe({
      next: (res: any) => this.categorias = res,
      error: (err) => console.error('Error cargando categorías:', err)
    });
  }

  cargarProductos(page: number): void {
    this.isLoading = true;
    
    // Preparamos los filtros para enviarlos al servicio
    const filtrosParams = {
      page: page,
      limit: 12,
      category_id: this.filtroCategoria !== 'Todas' ? this.filtroCategoria : null,
      min_price: this.minPrice,
      max_price: this.maxPrice
    };

    this.productoService.getProductosFiltrados(filtrosParams).subscribe({
      next: (res: any) => {
        this.productos = res.data || res;
        this.paginaActual = res.current_page || page;
        this.totalPaginas = res.last_page || 1;

        // Datos para el contador de la UI
        this.totalProductos = res.total || 0;
        this.desde = res.from || 0;
        this.hasta = res.to || 0;

        this.isLoading = false;
        this.cdr.detectChanges();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        console.error('Error cargando productos:', err);
        this.isLoading = false;
      }
    });
  }

  // --- ACCIONES DE FILTROS ---

  aplicarFiltros(): void {
    this.cargarProductos(1); // Al filtrar, volvemos a la página 1
  }

  limpiarFiltros(): void {
    this.filtroCategoria = 'Todas';
    this.minPrice = 0;
    this.maxPrice = 100;
    this.cargarProductos(1);
  }

  // --- PAGINACIÓN ---

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.cargarProductos(nuevaPagina);
    }
  }

  get numeracionPaginas(): number[] {
    const total = this.totalPaginas;
    const current = this.paginaActual;
    const maxVisible = 5;

    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    let start = Math.max(current - 2, 1);
    let end = Math.min(start + maxVisible - 1, total);

    if (end === total) {
      start = Math.max(end - maxVisible + 1, 1);
    }

    return Array.from({ length: (end - start) + 1 }, (_, i) => start + i);
  }

  // --- INTERACCIÓN ---

  formatLabel(value: number): string {
    return `${value}€`;
  }

  toggleFavorite(prod: Producto): void {
    prod.is_favorite = !prod.is_favorite; // Optimistic UI
    this.productoService.toggleFavorite(prod.id).subscribe({
      error: (err) => {
        prod.is_favorite = !prod.is_favorite; // Revertir si falla
        console.error(err);
      }
    });
  }

  agregarAlCarrito(prod: Producto): void {
    console.log('Añadiendo al carrito:', prod.name);
    // Aquí llamarías a tu cartService.addToCart(prod)
  }
}