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

  // URL Base de la API
  private readonly API_URL = environment.apiUrl;

  // DATOS DE PRODUCTOS
  productos: Producto[] = [];
  paginaActual: number = 1;
  totalPaginas: number = 1;
  itemsPorPagina: number = 6;
  totalProductos: number = 0;

  // FILTROS
  minPrice: number = 0;
  maxPrice: number = 100;
  categoriasRapidas: string[] = ['Todas', 'Frutas', 'Verduras', 'Granos', 'Lácteos', 'Especias'];
  filtros = { 
    categoria: 'todas', 
    precioMax: 50, 
    ubicacion: 'todas', 
    valoracion: 'todas', 
    orden: 'novedad' 
  };

  // ESTADO Y USUARIO
  isFarmer: boolean = false;
  currentUser: any = null;
  isLoading: boolean = true;

  constructor(
    private router: Router,
    private productoService: ProductoService,
    private cdr: ChangeDetectorRef,
    private cartService: CartService
  ) { }

  ngOnInit(): void {
    this.verificarUsuario();
    this.cargarProductos(1);
  }

  // --- LÓGICA DE USUARIO ---
  verificarUsuario(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        this.currentUser = JSON.parse(userStr);
        if (this.currentUser.role === 'agricultor' || this.currentUser.role_id === 2 || this.currentUser.role === 'farmer') {
          this.isFarmer = true;
        }
      }
    }
  }

  // --- LÓGICA DE PRODUCTOS ---
  cargarProductos(page: number): void {
    this.isLoading = true;
    this.paginaActual = page;

    this.productoService.getDestacados(page).subscribe({
      next: (res: any) => {
        this.productos = res.data || (Array.isArray(res) ? res : []);
        this.totalProductos = res.total || 0;
        this.totalPaginas = res.last_page || 1;

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error cargando productos:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // --- GESTIÓN DE IMÁGENES ---
  getImagenUrl(prod: any): string {
    if (prod.images && prod.images.length > 0) {
      const path = prod.images[0].image_path;
      
      // Si ya es una URL completa (Google/Azure), se limpia para usar el proxy local si es necesario
      if (path.startsWith('http')) {
        return path.replace(/http:\/\/127\.0\.0\.1:8000|https:\/\/agroconecta-backend-v2-.*\.azurewebsites\.net/g, this.API_URL);
      }
      
      // Si es ruta relativa de Laravel
      return `${this.API_URL}/storage/${path}`;
    }
    return 'assets/placeholder.png';
  }

  // --- NAVEGACIÓN ---
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

  // --- INTERACCIÓN ---
  toggleFavorite(prod: any): void {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      alert('Debes iniciar sesión para guardar favoritos');
      this.router.navigate(['/login']);
      return;
    }

    prod.is_favorite = !prod.is_favorite;

    this.productoService.toggleFavorite(prod.id).subscribe({
      next: () => console.log('Favorito actualizado correctamente'),
      error: (err: any) => {
        console.error('Error al actualizar favorito:', err);
        prod.is_favorite = !prod.is_favorite;

        if (err.status === 401) {
          alert('Tu sesión ha expirado. Por favor, vuelve a entrar.');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          this.router.navigate(['/login']);
        }
      }
    });
  }

  addToCart(producto: any): void {
    this.cartService.addToCart(producto);
  }

  irAlCatalogoCompleto(): void {
    this.router.navigate(['/productos']);
  }

  // --- LÓGICA DE FILTROS ---
  seleccionarCategoriaRapida(categoria: string): void {
    this.filtros.categoria = categoria.toLowerCase();
    this.cargarProductos(1); 
  }

  filtrarPorPrecio(): void {
    this.cargarProductos(1);
  }

  limpiarFiltros(): void {
    this.filtros = { 
      categoria: 'todas', 
      precioMax: 50, 
      ubicacion: 'todas', 
      valoracion: 'todas', 
      orden: 'novedad' 
    };
    this.minPrice = 0;
    this.maxPrice = 100;
    this.cargarProductos(1);
  }

  formatLabel(value: number): string {
    return `${value}€`;
  }
}