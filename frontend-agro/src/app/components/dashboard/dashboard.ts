import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Material
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Servicios y Modelos
import { ProductoService } from '../../services/producto.service';
import { CartService } from '../../services/cart.service';
import { Producto } from '../../models/producto';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatSliderModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  // URL Base de la API (Limpiamos el /api para las imágenes)
  private readonly BASE_HOST = environment.apiUrl.split('/api')[0];

  // DATOS DE PRODUCTOS
  productos: Producto[] = [];
  paginaActual: number = 1;
  totalPaginas: number = 1;
  itemsPorPagina: number = 6;
  totalProductos: number = 0;

  // IMPORTANTE: Array real para evitar el error NG02200
  paginasArray: number[] = [];

  // ESTADO Y USUARIO
  isFarmer: boolean = false;
  currentUser: any = null;
  isLoading: boolean = false; // Empezamos en false para evitar NG0100 al inicio

  // FILTROS
  minPrice: number = 0;
  maxPrice: number = 100;
  categoriasRapidas: string[] = ['Todas', 'Frutas', 'Verduras', 'Granos', 'Lácteos', 'Especias'];
  filtros = { categoria: 'todas', precioMax: 50, ubicacion: 'todas', valoracion: 'todas', orden: 'novedad' };

  constructor(
    private router: Router,
    private productoService: ProductoService,
    private cdr: ChangeDetectorRef,
    private cartService: CartService
  ) { }

  ngOnInit(): void {
    this.verificarUsuario();
    // ✅ Espera a que Angular termine el ciclo de inicialización
    Promise.resolve().then(() => this.cargarProductos(1));
  }


  verificarUsuario(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        this.currentUser = JSON.parse(userStr);
        const role = this.currentUser.role?.toLowerCase();
        if (role === 'agricultor' || role === 'farmer' || this.currentUser.role_id === 2) {
          this.isFarmer = true;
        }
      }
    }
  }

  // --- CARGA DE PRODUCTOS (6 POR PÁGINA) ---
  cargarProductos(page: number): void {
    // ✅ Cambio síncrono ANTES de lanzar la petición, no en setTimeout
    this.isLoading = true;
    this.paginaActual = page;

    this.productoService.getDestacados(page, this.itemsPorPagina).subscribe({
      next: (res: any) => {
        this.productos = Array.isArray(res.data) ? res.data : [];
        this.totalProductos = res.total || 0;

        const paginasDesdeServer = res.last_page || 1;
        this.totalPaginas = paginasDesdeServer > 2 ? 2 : paginasDesdeServer;

        this.paginasArray = [];
        for (let i = 1; i <= this.totalPaginas; i++) {
          this.paginasArray.push(i);
        }

        this.isLoading = false;
        this.cdr.detectChanges(); // ✅ Solo aquí, tras recibir datos
      },
      error: (err: any) => {
        console.error('Error cargando productos:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }


  getImagenUrl(prod: any): string {
    if (prod.images && prod.images.length > 0) {
      const path = prod.images[0].image_path;
      if (path.startsWith('http')) return path;
      return `${this.BASE_HOST}/storage/${path}`;
    }
    return 'assets/placeholder.png';
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina === this.paginaActual || nuevaPagina < 1 || nuevaPagina > this.totalPaginas) return;
    this.cargarProductos(nuevaPagina);

    const elemento = document.getElementById('inicio-lista');
    if (elemento) {
      setTimeout(() => {
        elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  toggleFavorite(prod: any): void {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }
    prod.is_favorite = !prod.is_favorite;
    this.productoService.toggleFavorite(prod.id).subscribe({
      next: () => console.log('Favorito actualizado'),
      error: (err: any) => {
        prod.is_favorite = !prod.is_favorite;
        if (err.status === 401) this.router.navigate(['/login']);
      }
    });
  }

  addToCart(producto: any): void { this.cartService.addToCart(producto); }
  irAlCatalogoCompleto(): void { this.router.navigate(['/productos']); }

  seleccionarCategoriaRapida(cat: string): void {
    this.filtros.categoria = cat.toLowerCase();
    this.cargarProductos(1);
  }

  limpiarFiltros(): void {
    this.filtros = { categoria: 'todas', precioMax: 50, ubicacion: 'todas', valoracion: 'todas', orden: 'novedad' };
    this.minPrice = 0;
    this.maxPrice = 100;
    this.cargarProductos(1);
  }

  formatLabel(value: number): string { return `${value}€`; }

  filtrarPorPrecio(): void {
    this.cargarProductos(1);
  }
}