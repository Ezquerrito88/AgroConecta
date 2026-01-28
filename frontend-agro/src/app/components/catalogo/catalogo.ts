import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css' // <--- Usaremos el CSS del dashboard
})
export class Catalogo implements OnInit {
  
  productos: any[] = [];
  paginaActual: number = 1;
  totalPaginas: number = 1;

  // Objeto para guardar los filtros
  filtros = {
    search: '',
    categoria: '',
    minPrice: null,
    maxPrice: null,
    sort: ''
  };

  constructor(private productoService: ProductoService) {}

  ngOnInit() {
    this.cargarProductos();
  }

  cargarProductos() {
    this.productoService.getAllProducts(this.paginaActual, this.filtros).subscribe({
      next: (res: any) => {
        this.productos = res.data;
        this.paginaActual = res.current_page;
        this.totalPaginas = res.last_page;
        window.scrollTo(0, 0); // Subir arriba al cargar
      },
      error: (err) => console.error(err)
    });
  }

  filtrarCategoria(cat: string) {
    this.filtros.categoria = cat;
    this.paginaActual = 1; // Resetear a pág 1 al filtrar
    this.cargarProductos();
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;
      this.cargarProductos();
    }
  }
}