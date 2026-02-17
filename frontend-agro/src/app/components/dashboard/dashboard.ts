import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Angular Material
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

  // URL dinámica del entorno actual
  private readonly API_URL = environment.apiUrl;

  productos: Producto[] = [];
  paginaActual: number = 1;
  totalPaginas: number = 1;
  itemsPorPagina: number = 6;
  totalProductos: number = 0;

  minPrice: number = 0;
  maxPrice: number = 100;

  isFarmer: boolean = false;
  currentUser: any = null;
  isLoading: boolean = true;

  categoriasRapidas: string[] = ['Todas', 'Frutas', 'Verduras', 'Granos', 'Lácteos', 'Especias'];

  filtros = {
    categoria: 'todas',
    precioMax: 50,
    ubicacion: 'todas',
    valoracion: 'todas',
    orden: 'novedad'
  };

  constructor(
    private router: Router,
    private productoService: ProductoService,
    private cdr: ChangeDetectorRef,
    private cartService: CartService
  ) { }

  ngOnInit() {
    this.verificarUsuario();
    this.cargarProductos(1);
  }

  // --- GESTIÓN DE IMÁGENES ---
  // Esta función asegura que las fotos se vean en local y en Azure sin errores 404
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

  // --- LÓGICA DE USUARIO ---
  verificarUsuario() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
      // Soporte para ambos formatos de rol (nombre o ID)
      if (this.currentUser.role === 'agricultor' || this.currentUser.role_id === 2) {
        this.isFarmer = true;
      }
    }
  }

  // --- LÓGICA DE PRODUCTOS ---
  cargarProductos(page: number) {
    this.isLoading = true;
    this.paginaActual = page;

    // Aquí pasamos la página y podríamos pasar this.filtros si el servicio lo soporta
    this.productoService.getDestacados(page).subscribe({
      next: (res: any) => {
        this.productos = res.data || res;
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

  cambiarPagina(nuevaPagina: number) {
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
  toggleFavorite(prod: any) {
    prod.is_favorite = !prod.is_favorite; // UI Optimista
    this.productoService.toggleFavorite(prod.id).subscribe({
      error: (err) => {
        console.error('Error al guardar favorito:', err);
        prod.is_favorite = !prod.is_favorite; // Revertir si falla
      }
    });
  }

  seleccionarCategoriaRapida(categoria: string) {
    this.filtros.categoria = categoria.toLowerCase();
    // TODO: Implementar filtrado en el servicio
    // this.cargarProductos(1); 
  }

  filtrarPorPrecio() {
    console.log(`Filtrando: ${this.minPrice}€ - ${this.maxPrice}€`);
    // this.cargarProductos(1);
  }

  addToCart(producto: any) {
    this.cartService.addToCart(producto);
  }

  irAlCatalogoCompleto() { this.router.navigate(['/productos']); }
  formatLabel(value: number): string { return value + '€'; }
  
  limpiarFiltros() {
    this.filtros = { categoria: 'todas', precioMax: 50, ubicacion: 'todas', valoracion: 'todas', orden: 'novedad' };
    this.minPrice = 0;
    this.maxPrice = 100;
  }
}