import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatSliderModule,
    MatSelectModule,
    MatFormFieldModule
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

  // DATOS DE USUARIO (NUEVO)
  isFarmer: boolean = false;
  currentUser: any = null;

  // CATEGORÍAS RÁPIDAS (Para los botones tipo píldora)
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
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    // 1. Verificamos quién es el usuario antes de cargar nada
    this.verificarUsuario();

    // 2. Cargamos los productos
    this.cargarProductos(1);
  }

  // --- LÓGICA DE USUARIO (NUEVO) ---
  verificarUsuario() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.currentUser = JSON.parse(userStr);

      // Comprobamos si es agricultor (ajusta 'agricultor' según tu BD)
      if (this.currentUser.role === 'agricultor' || this.currentUser.role_id === 2) {
        this.isFarmer = true;
      }
    }
  }

  // --- LÓGICA DE PRODUCTOS ---
  cargarProductos(page: number) {
    this.productoService.getDestacados(page).subscribe({
      next: (res: any) => {
        this.productos = res.data;
        this.paginaActual = res.current_page;
        this.totalPaginas = res.last_page;
        this.totalProductos = res.total;

        this.cdr.detectChanges();
        console.log('Productos cargados:', this.productos.length);
      },
      error: (err: any) => console.error('Error:', err)
    });
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina === this.paginaActual || nuevaPagina < 1 || nuevaPagina > this.totalPaginas) {
      return;
    }

    this.productoService.getDestacados(nuevaPagina).subscribe({
      next: (res: any) => {
        this.productos = [...res.data];
        this.paginaActual = res.current_page;
        this.totalPaginas = res.last_page;
        this.totalProductos = res.total;

        this.cdr.detectChanges();

        const elemento = document.getElementById('inicio-lista');
        if (elemento) {
          // Hacemos scroll suave hasta ese elemento (con un margen para que no quede pegado)
          elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      },
      error: (err: any) => console.error('Error al cambiar página:', err)
    });
  }

  // --- INTERACCIÓN ---
  toggleFavorite(prod: Producto) {
    prod.fav = !prod.fav;
    // Aquí podrías llamar al servicio para guardar el favorito en BD
    this.cdr.detectChanges();
  }

  irAlCatalogoCompleto() {
    this.router.navigate(['/productos']);
  }

  // --- LÓGICA DE FILTROS ---
  seleccionarCategoriaRapida(categoria: string) {
    this.filtros.categoria = categoria.toLowerCase();
    // Aquí podrías recargar productos filtrados si tu backend lo soporta
    console.log('Categoría seleccionada:', this.filtros.categoria);
  }

  formatLabel(value: number): string {
    return value + '€';
  }

  filtrarPorPrecio() {
    console.log(`Filtrando precios: ${this.minPrice}€ - ${this.maxPrice}€`);
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
}