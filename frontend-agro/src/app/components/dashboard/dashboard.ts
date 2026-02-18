import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ProductoService } from '../../services/producto.service';
import { CartService } from '../../services/cart.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatSliderModule, MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  private readonly BASE_HOST = environment.apiUrl.split('/api')[0];

  productos: any[]   = [];
  paginaActual       = 1;
  totalPaginas       = 1;
  itemsPorPagina     = 6;
  totalProductos     = 0;
  paginasArray: number[] = [];

  isFarmer           = false;
  currentUser: any   = null;
  isLoading          = false;

  minPrice = 0;
  maxPrice = 100;
  categoriasRapidas  = ['Todas', 'Frutas', 'Verduras', 'Granos', 'Lácteos', 'Especias'];
  filtros = { categoria: 'todas', orden: 'novedad' };

  constructor(
    private router: Router,
    private productoService: ProductoService,
    private cdr: ChangeDetectorRef,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.verificarUsuario();
    Promise.resolve().then(() => this.cargarProductos(1));
  }

  verificarUsuario(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        this.currentUser = JSON.parse(userStr);
        const role = this.currentUser.role?.toLowerCase();
        this.isFarmer = role === 'agricultor' || role === 'farmer' || this.currentUser.role_id === 2;
      }
    }
  }

  cargarProductos(page: number): void {
    this.isLoading    = true;
    this.paginaActual = page;

    // Solo mandamos filtros con valor real
    const filtrosActivos: any = {};
    if (this.filtros.categoria !== 'todas')  filtrosActivos.categoria  = this.filtros.categoria;
    if (this.filtros.orden !== 'novedad')    filtrosActivos.orden      = this.filtros.orden;
    if (this.minPrice > 0)                   filtrosActivos.precio_min = this.minPrice;
    if (this.maxPrice < 100)                 filtrosActivos.precio_max = this.maxPrice;

    this.productoService.getDestacados(page, this.itemsPorPagina, filtrosActivos).subscribe({
      next: (res: any) => {
        this.productos      = Array.isArray(res.data) ? res.data : [];
        this.totalProductos = res.total || 0;
        const paginasServer = res.last_page || 1;
        this.totalPaginas   = paginasServer > 2 ? 2 : paginasServer;
        this.paginasArray   = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
        this.isLoading      = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  seleccionarCategoriaRapida(cat: string): void {
    this.filtros.categoria = cat.toLowerCase();
    this.cargarProductos(1);
  }

  onFiltroChange(): void   { this.cargarProductos(1); }
  filtrarPorPrecio(): void { this.cargarProductos(1); }

  limpiarFiltros(): void {
    this.filtros  = { categoria: 'todas', orden: 'novedad' };
    this.minPrice = 0;
    this.maxPrice = 100;
    this.cargarProductos(1);
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina === this.paginaActual || nuevaPagina < 1 || nuevaPagina > this.totalPaginas) return;
    this.cargarProductos(nuevaPagina);
    const el = document.getElementById('inicio-lista');
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }

  toggleFavorite(prod: any): void {
    if (!localStorage.getItem('auth_token')) { this.router.navigate(['/login']); return; }
    prod.is_favorite = !prod.is_favorite;
    this.productoService.toggleFavorite(prod.id).subscribe({
      error: (err: any) => {
        prod.is_favorite = !prod.is_favorite;
        if (err.status === 401) this.router.navigate(['/login']);
      }
    });
  }

  getImagenUrl(prod: any): string {
    if (prod.images?.length > 0) {
      const path = prod.images[0].image_path;
      return path.startsWith('http') ? path : `${this.BASE_HOST}/storage/${path}`;
    }
    return 'assets/placeholder.png';
  }

  addToCart(producto: any): void     { this.cartService.addToCart(producto); }
  irAlCatalogoCompleto(): void       { this.router.navigate(['/productos']); }
  formatLabel(value: number): string { return `${value}€`; }
}
