import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CartService } from '../../services/cart.service';

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

  // DATOS DE PRODUCTOS
  productos: Producto[] = [];
  paginaActual: number = 1;
  totalPaginas: number = 1;
  itemsPorPagina: number = 6;
  totalProductos: number = 0;

  // FILTROS
  minPrice: number = 0;
  maxPrice: number = 100;

  // DATOS DE USUARIO
  isFarmer: boolean = false;
  currentUser: any = null;

  // 🌀 VARIABLE DE CARGA (Empieza en true para que salga al inicio)
  isLoading: boolean = true;

  // CATEGORÍAS RÁPIDAS
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
    // Cargamos la primera página
    this.cargarProductos(1);
  }

  // --- LÓGICA DE USUARIO ---
  verificarUsuario() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
      if (this.currentUser.role === 'agricultor' || this.currentUser.role_id === 2) {
        this.isFarmer = true;
      }
    }
  }

  // --- LÓGICA DE PRODUCTOS ---
  
  cargarProductos(page: number) {
    // 1. Activamos el spinner antes de llamar al servicio
    this.isLoading = true;
    this.paginaActual = page;

    this.productoService.getDestacados(page).subscribe({
      next: (res: any) => {
        // Obtenemos los datos (ajusta si tu backend devuelve res.data o res directamente)
        this.productos = res.data || res;
        
        // Actualizamos contadores de paginación
        this.paginaActual = res.current_page || page;
        this.totalPaginas = res.last_page || 1;
        this.totalProductos = res.total || 0;

        // 2. Desactivamos el spinner porque ya tenemos datos
        this.isLoading = false;
        this.cdr.detectChanges();
        
        console.log('Productos cargados:', this.productos.length);
      },
      error: (err: any) => {
        console.error('Error cargando productos:', err);
        // 3. Desactivamos el spinner aunque falle (para no bloquear la pantalla)
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cambiarPagina(nuevaPagina: number) {
    // Validaciones para no pedir páginas que no existen
    if (nuevaPagina === this.paginaActual || nuevaPagina < 1 || nuevaPagina > this.totalPaginas) {
      return;
    }

    // Activamos spinner manual (opcional, ya lo hace cargarProductos, pero para asegurar)
    this.isLoading = true;

    // Reutilizamos la función principal (más limpio)
    this.cargarProductos(nuevaPagina);

    // Scroll suave hacia arriba
    const elemento = document.getElementById('inicio-lista');
    if (elemento) {
      setTimeout(() => {
        elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100); // Pequeño delay para dejar que Angular renderice
    }
  }

  // --- INTERACCIÓN ---
  toggleFavorite(prod: any) {
    // UI Optimista: cambiamos el icono al instante
    prod.is_favorite = !prod.is_favorite;

    this.productoService.toggleFavorite(prod.id).subscribe({
      next: (response: any) => {
        console.log('Favorito actualizado');
      },
      error: (err) => {
        console.error('Error al guardar favorito:', err);
        // Si falla, revertimos el cambio visual
        prod.is_favorite = !prod.is_favorite;
      }
    });
  }

  irAlCatalogoCompleto() {
    this.router.navigate(['/productos']);
  }

  // --- LÓGICA DE FILTROS ---
  seleccionarCategoriaRapida(categoria: string) {
    this.filtros.categoria = categoria.toLowerCase();
    console.log('Categoría seleccionada:', this.filtros.categoria);
    // Aquí podrías llamar a this.cargarProductos(1) si el backend filtra
  }

  formatLabel(value: number): string {
    return value + '€';
  }

  filtrarPorPrecio() {
    console.log(`Filtrando precios: ${this.minPrice}€ - ${this.maxPrice}€`);
    // Aquí llamarías al servicio con los filtros
    this.cdr.detectChanges();
  }

  limpiarFiltros() {
    this.filtros = {
      categoria: 'todas',
      precioMax: 50,
      ubicacion: 'todas',
      valoracion: 'todas',
      orden: 'novedad'
    };
    this.minPrice = 0;
    this.maxPrice = 100;
  }

  addToCart(producto: any) {
    this.cartService.addToCart(producto);
  }
}