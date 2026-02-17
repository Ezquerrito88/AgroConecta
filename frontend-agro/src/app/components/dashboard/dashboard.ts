import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// --- ANGULAR MATERIAL ---
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// --- SERVICIOS Y MODELOS ---
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

  // URL dinámica del entorno actual (Local o Azure)
  private readonly API_URL = environment.apiUrl;

  // Datos de productos
  productos: Producto[] = [];
  paginaActual: number = 1;
  totalPaginas: number = 1;
  itemsPorPagina: number = 6; // Configurado a 6 productos
  totalProductos: number = 0;

  // Filtros
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

  // Usuario y Estado
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

  // --- GESTIÓN DE IMÁGENES ---
  // Resuelve las rutas de las fotos dinámicamente según el servidor
  getImagenUrl(prod: any): string {
    if (prod.images && prod.images.length > 0) {
      const path = prod.images[0].image_path;
      
      if (path.startsWith('http')) {
        return path.replace(/http:\/\/127\.0\.0\.1:8000|https:\/\/agroconecta-backend-v2-.*\.azurewebsites\.net/g, this.API_URL);
      }
      
      return `${this.API_URL}/storage/${path}`;
    }
    return 'assets/placeholder.png';
  }

  // --- LÓGICA DE PRODUCTOS ---
  cargarProductos(page: number): void {
    this.isLoading = true;
    this.paginaActual = page;

    // Forzamos el límite a 6 productos por página
    this.productoService.getDestacados(page, 6).subscribe({
      next: (res: any) => {
        // Soporte para formato paginado de Laravel
        this.productos = res.data || (Array.isArray(res) ? res : []);
        this.paginaActual = res.current_page || page;
        this.totalPaginas = res.last_page || 1;
        this.totalProductos = res.total || 0;

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

  // --- NAVEGACIÓN Y PAGINACIÓN ---
  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina === this.paginaActual || nuevaPagina < 1 || nuevaPagina > this.totalPaginas) return;
    this.cargarProductos(nuevaPagina);

    // Scroll suave hacia arriba de la lista
    const elemento = document.getElementById('inicio-lista');
    if (elemento) {
      setTimeout(() => {
        elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  // --- INTERACCIÓN ---
  toggleFavorite(prod: any): void {
    prod.is_favorite = !prod.is_favorite; // UI Optimista
    this.productoService.toggleFavorite(prod.id).subscribe({
      error: (err: any) => {
        console.error('Error al guardar favorito:', err);
        prod.is_favorite = !prod.is_favorite; // Revertir si falla
      }
    });
  }

  addToCart(producto: any): void {
    this.cartService.addToCart(producto);
  }

  // --- FILTROS ---
  filtrarPorPrecio(): void {
    console.log(`Filtrando por rango: ${this.minPrice}€ - ${this.maxPrice}€`);
    this.cargarProductos(1); // Reiniciar a la página 1 al filtrar
  }

  seleccionarCategoriaRapida(categoria: string): void {
    this.filtros.categoria = categoria.toLowerCase();
    // Aquí puedes llamar a cargarProductos(1) si el backend lo soporta
  }

  limpiarFiltros(): void {
    this.filtros = { categoria: 'todas', precioMax: 50, ubicacion: 'todas', valoracion: 'todas', orden: 'novedad' };
    this.minPrice = 0;
    this.maxPrice = 100;
    this.cargarProductos(1);
  }

  // --- UTILIDADES ---
  verificarUsuario(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        this.currentUser = JSON.parse(userStr);
        if (this.currentUser.role === 'agricultor' || this.currentUser.role_id === 2) {
          this.isFarmer = true;
        }
      }
    }
  }

  irAlCatalogoCompleto(): void {
    this.router.navigate(['/productos']);
  }

  formatLabel(value: number): string {
    return `${value}€`;
  }
}