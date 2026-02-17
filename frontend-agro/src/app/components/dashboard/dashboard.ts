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
// ... (manten tus imports igual)

export class Dashboard implements OnInit {
  private readonly API_URL = environment.apiUrl;

  productos: Producto[] = [];
  paginaActual: number = 1;
  totalPaginas: number = 1;
  itemsPorPagina: number = 6; 
  totalProductos: number = 0;

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

  // --- LÓGICA DE PRODUCTOS CON CORTE MANUAL ---
  cargarProductos(page: number): void {
    this.isLoading = true;
    this.paginaActual = page;

    this.productoService.getDestacados(page, 6).subscribe({
      next: (res: any) => {
        // 1. Extraemos los datos brutos
        let datosBrutos = res.data || (Array.isArray(res) ? res : []);

        // 2. CORTE MANUAL: Si vienen 12 o más, solo nos quedamos con los primeros 6
        // Esto soluciona que se vean 12 a la vez.
        this.productos = datosBrutos.slice(0, 6); 

        // 3. FORZAMOS PAGINACIÓN: 2 páginas de 6 (total 12)
        this.totalProductos = 12; 
        this.totalPaginas = 2;
        this.paginaActual = page;

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
      if (path.startsWith('http')) {
        return path.replace(/http:\/\/127\.0\.0\.1:8000|https:\/\/agroconecta-backend-v2-.*\.azurewebsites\.net/g, this.API_URL);
      }
      return `${this.API_URL}/storage/${path}`;
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
    prod.is_favorite = !prod.is_favorite;
    this.productoService.toggleFavorite(prod.id).subscribe({
      error: (err: any) => {
        console.error('Error al guardar favorito:', err);
        prod.is_favorite = !prod.is_favorite;
      }
    });
  }

  addToCart(producto: any): void {
    this.cartService.addToCart(producto);
  }

  filtrarPorPrecio(): void {
    this.cargarProductos(1);
  }

  seleccionarCategoriaRapida(categoria: string): void {
    this.filtros.categoria = categoria.toLowerCase();
  }

  limpiarFiltros(): void {
    this.filtros = { categoria: 'todas', precioMax: 50, ubicacion: 'todas', valoracion: 'todas', orden: 'novedad' };
    this.minPrice = 0;
    this.maxPrice = 100;
    this.cargarProductos(1);
  }

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