import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductoService } from '../../core/services/producto.service';
import { CartService } from '../../core/services/cart.service';
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

  productos: any[] = [];
  paginaActual = 1;
  totalPaginas = 1;
  itemsPorPagina = 6;
  totalProductos = 0;
  paginasArray: number[] = [];

  isFarmer = false;
  currentUser: any = null;
  isLoading = false;
  isBuyer = false;

  // Filtros dinámicos
  productosFiltroMaestro: any[] = [];
  categoriasDisponibles: string[] = [];
  rangoMinPrecio = 0;
  rangoMaxPrecio = 1000;

  minPrice = 0;
  maxPrice = 100;
  categoriasRapidas = ['Todas'];
  filtros = { categoria: 'todas', orden: 'novedad' };

  constructor(
    private router: Router,
    private productoService: ProductoService,
    private cdr: ChangeDetectorRef,
    private cartService: CartService
  ) { }

  ngOnInit(): void {
    this.verificarUsuario();
    this.cargarOpcionesFiltros();
    Promise.resolve().then(() => this.cargarProductos(1));
  }

  cargarOpcionesFiltros(): void {
    // Obtenemos una lista para extraer filtros dinámicos (usamos getCatalogo en vez de destacados para mas precisión o una cantidad alta)
    this.productoService.getCatalogo({ per_page: 500 }).subscribe({
      next: (res: any) => {
        this.productosFiltroMaestro = res.data ?? [];
        this.recalcularFiltrosDinamicos(true);
      },
      error: (err: any) => console.error('Error cargando filtros dinámicos', err)
    });
  }

  recalcularFiltrosDinamicos(isInitial: boolean = false): void {
    if (!this.productosFiltroMaestro || this.productosFiltroMaestro.length === 0) return;

    let productosBuscados = this.productosFiltroMaestro;
    const selectedCat = this.filtros.categoria !== 'todas' ? this.filtros.categoria : '';
    
    const catMatch = (p: any, cat: string) => !cat || (p.category?.name?.toLowerCase() === cat);

    // Extraer Categorías Dinámicas
    const cats = new Set<string>();
    productosBuscados.forEach((p: any) => {
      if (p.category?.name) cats.add(p.category.name);
    });
    this.categoriasDisponibles = Array.from(cats).sort();
    
    // Actualizar botones de categoría rápida (máx 5 + Todas)
    this.categoriasRapidas = ['Todas', ...this.categoriasDisponibles.slice(0, 5)];

    // Extraer Precios Mínimos y Máximos cruzados (se filtran por categoría elegida)
    const priceProducts = productosBuscados.filter(p => catMatch(p, selectedCat));
    if (priceProducts.length > 0) {
      const prices = priceProducts.map(p => Number(p.price) || 0);
      let minGlobal = Math.floor(Math.min(...prices));
      let maxGlobal = Math.ceil(Math.max(...prices));
      
      if (minGlobal === maxGlobal) {
        maxGlobal = minGlobal + 1;
      }
      
      const wasFullyOpen = (this.minPrice <= this.rangoMinPrecio && this.maxPrice >= this.rangoMaxPrecio);

      this.rangoMinPrecio = minGlobal;
      this.rangoMaxPrecio = maxGlobal;

      if (isInitial || wasFullyOpen) {
        this.minPrice = minGlobal;
        this.maxPrice = maxGlobal;
      } else {
        if (this.minPrice < minGlobal) this.minPrice = minGlobal;
        if (this.minPrice > maxGlobal) this.minPrice = maxGlobal;
        if (this.maxPrice > maxGlobal) this.maxPrice = maxGlobal;
        if (this.maxPrice < minGlobal) this.maxPrice = minGlobal;
        if (this.minPrice > this.maxPrice) {
          this.minPrice = minGlobal;
          this.maxPrice = maxGlobal;
        }
      }
    } else {
      this.rangoMinPrecio = 0;
      this.rangoMaxPrecio = 100;
      this.minPrice = 0;
      this.maxPrice = 100;
    }
  }

  verificarUsuario(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        this.currentUser = JSON.parse(userStr);
        const role = this.currentUser.role?.toLowerCase();

        this.isFarmer = role === 'agricultor' || role === 'farmer' || this.currentUser.role_id === 2;
        this.isBuyer = role === 'comprador' || role === 'buyer' || this.currentUser.role_id === 3;

      } else {
        this.isBuyer = true;
      }
    }
  }

  // Usa image_url del backend, fallback a construcción manual
  getImagenUrl(prod: any): string {
    if (prod?.images?.length > 0) {
      return prod.images[0].image_url
        ?? `${environment.storageUrl}/${prod.images[0].image_path}`;
    }
    return 'assets/placeholder.png';
  }

  cargarProductos(page: number): void {
    if (this.productosFiltroMaestro.length > 0) {
      this.recalcularFiltrosDinamicos(false);
    }
    
    this.isLoading = true;
    this.paginaActual = page;

    const filtrosActivos: any = {};
    if (this.filtros.categoria !== 'todas') filtrosActivos.categoria = this.filtros.categoria;
    if (this.filtros.orden !== 'novedad') filtrosActivos.orden = this.filtros.orden;
    if (this.minPrice > 0) filtrosActivos.precio_min = this.minPrice;
    if (this.maxPrice < 100) filtrosActivos.precio_max = this.maxPrice;

    this.productoService.getDestacados(page, this.itemsPorPagina, filtrosActivos).subscribe({
      next: (res: any) => {
        this.productos = Array.isArray(res.data) ? res.data : [];
        this.totalProductos = res.total || 0;
        const paginasServer = res.last_page || 1;
        this.totalPaginas = paginasServer > 2 ? 2 : paginasServer;
        this.paginasArray = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
        this.isLoading = false;
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

  onFiltroChange(): void { this.cargarProductos(1); }
  filtrarPorPrecio(): void { this.cargarProductos(1); }

  limpiarFiltros(): void {
    this.filtros = { categoria: 'todas', orden: 'novedad' };
    this.minPrice = this.rangoMinPrecio;
    this.maxPrice = this.rangoMaxPrecio;
    this.cargarProductos(1);
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina === this.paginaActual || nuevaPagina < 1 || nuevaPagina > this.totalPaginas) return;
    this.cargarProductos(nuevaPagina);
    const el = document.getElementById('inicio-lista');
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }

  toggleFavorite(prod: any): void {
    if (!localStorage.getItem('token')) {
      this.router.navigate(['/login']);
      return;
    }
    prod.is_favorite = !prod.is_favorite;
    this.productoService.toggleFavorite(prod.id).subscribe({
      error: (err: any) => {
        prod.is_favorite = !prod.is_favorite;
        if (err.status === 401) this.router.navigate(['/login']);
      }
    });
  }

  addToCart(producto: any): void {
    this.cartService.addToCart({
      id: Number(producto.id),
      name: producto.name,
      farmer: producto?.farmer?.user?.name || producto?.farmer?.full_name || producto?.farmer?.name || 'Agricultor local',
      farmerId: Number(producto?.farmer?.user_id ?? producto?.farmer?.id ?? 0),
      price: Number(producto.price),
      unit: producto.unit ?? 'ud',
      quantity: 1,
      image: this.getImagenUrl(producto)
    });
  }

  irAlCatalogoCompleto(): void { this.router.navigate(['/productos']); }
  formatLabel(value: number): string { return `${value}€`; }
}
