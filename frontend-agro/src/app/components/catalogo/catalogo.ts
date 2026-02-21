import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatSliderModule, MatSelectModule,
    MatFormFieldModule, MatInputModule, MatIconModule
  ],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css'
})
export class Catalogo implements OnInit {

  private readonly API_URL = environment.apiUrl;

  productos: Producto[] = [];

  paginaActual    = 1;
  totalPaginas    = 1;
  totalProductos  = 0;
  desde           = 0;
  hasta           = 0;
  isLoading       = false;

  textoBusqueda   = '';
  filtroCategoria = '';
  filtroUbicacion = '';
  filtroOrden     = 'novedad';
  minPrice        = 0;
  maxPrice        = 100;

  constructor(
    private productoService: ProductoService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.textoBusqueda = params['search'] ?? '';
      this.cargarProductos(1);
    });
  }

  getImagenUrl(prod: any): string {
  if (prod?.images?.length > 0) {
    const path = prod.images[0].image_path;
    if (path.startsWith('http')) {
      return path.replace(/http:\/\/127\.0\.0\.1:8000/g, 'http://localhost:8000');
    }
    return `http://localhost:8000/storage/${path}`;
  }
  return 'assets/placeholder.png';
}


  cargarProductos(page: number): void {
    this.isLoading = true;

    const filtros = {
      page,
      per_page: 12,
      ...(this.textoBusqueda   && { search:   this.textoBusqueda }),
      ...(this.filtroCategoria && { category: this.filtroCategoria }),
      ...(this.filtroUbicacion && { location: this.filtroUbicacion }),
      ...(this.filtroOrden     && { orden:    this.filtroOrden }),
      min_price: this.minPrice,
      max_price: this.maxPrice,
    };

    this.productoService.getCatalogo(filtros).subscribe({
      next: (res: any) => {
        this.productos      = res.data ?? [];
        this.paginaActual   = res.current_page;
        this.totalPaginas   = res.last_page;
        this.totalProductos = res.total;
        this.desde          = res.from;
        this.hasta          = res.to;
        this.isLoading      = false;
        this.cdr.detectChanges();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  limpiarFiltros(): void {
    this.textoBusqueda   = '';
    this.filtroCategoria = '';
    this.filtroUbicacion = '';
    this.filtroOrden     = 'novedad';
    this.minPrice        = 0;
    this.maxPrice        = 100;
    this.cargarProductos(1);
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.cargarProductos(nuevaPagina);
    }
  }

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

  formatLabel(value: number): string {
    return value >= 1000 ? `${Math.round(value / 1000)}k` : `${value}€`;
  }

  toggleFavorite(prod: Producto): void {
    const token = localStorage.getItem('token');

    // ✅ Sin sesión → login
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    // ✅ Con sesión → optimistic update inmediato
    prod.is_favorite = !prod.is_favorite;

    this.productoService.toggleFavorite(prod.id).subscribe({
      error: () => {
        prod.is_favorite = !prod.is_favorite; // revierte si falla la API
      }
    });
  }

  agregarAlCarrito(prod: Producto): void {
    console.log('🛒 Añadir al carrito:', prod.name);
    // TODO: conectar con CartService
  }
}
