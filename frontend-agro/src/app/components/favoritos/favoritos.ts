import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { ProductoService } from '../../services/producto.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-favoritos',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatFormFieldModule, MatSelectModule,
    MatProgressSpinnerModule, MatSliderModule
  ],
  templateUrl: './favoritos.html',
  styleUrls: ['./favoritos.css']
})
export class Favoritos implements OnInit {

  private readonly API_URL = environment.apiUrl;

  productos: any[] = [];           // todos los favoritos de la BD
  productosFiltrados: any[] = [];  // los que se muestran tras filtrar
  isLoading = true;

  filtros = { categoria: 'todas', orden: 'novedad' };
  minPrice = 0;
  maxPrice = 100;

  constructor(
    private productoService: ProductoService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    Promise.resolve().then(() => this.cargarFavoritos());
  }

  getImagenUrl(prod: any): string {
    if (prod?.images?.length > 0) {
      const path = prod.images[0].image_path;
      if (path.startsWith('http')) {
        return path.replace(/http:\/\/127\.0\.0\.1:8000/g, this.API_URL);
      }
      return `${this.API_URL}/storage/${path}`;
    }
    return 'assets/placeholder.png';
  }

  cargarFavoritos(): void {
    this.isLoading = true;
    this.productoService.getFavoritos().subscribe({
      next: (data: any[]) => {
        this.productos = data;
        this.aplicarFiltros();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error cargando favoritos:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ✅ Filtra en cliente — sin llamadas extra a la API
  aplicarFiltros(): void {
    let result = [...this.productos];

    // Categoría
    if (this.filtros.categoria !== 'todas') {
      result = result.filter(p =>
        p.category?.name?.toLowerCase() === this.filtros.categoria ||
        p.category?.slug?.toLowerCase() === this.filtros.categoria
      );
    }

    // Precio
    result = result.filter(p =>
      +p.price >= this.minPrice && +p.price <= this.maxPrice
    );

    // Orden
    if (this.filtros.orden === 'precio_asc')  result.sort((a, b) => +a.price - +b.price);
    if (this.filtros.orden === 'precio_desc') result.sort((a, b) => +b.price - +a.price);
    if (this.filtros.orden === 'novedad')     result.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    this.productosFiltrados = result;
    this.cdr.detectChanges();
  }

  limpiarFiltros(): void {
    this.filtros   = { categoria: 'todas', orden: 'novedad' };
    this.minPrice  = 0;
    this.maxPrice  = 100;
    this.aplicarFiltros();
  }

  quitarFavorito(prod: any): void {
    const token = localStorage.getItem('token');
    if (!token) { this.router.navigate(['/login']); return; }

    const index = this.productos.indexOf(prod);
    this.productos          = this.productos.filter(p => p.id !== prod.id);
    this.productosFiltrados = this.productosFiltrados.filter(p => p.id !== prod.id);

    this.productoService.toggleFavorite(prod.id).subscribe({
      error: () => {
        this.productos.splice(index, 0, prod);
        this.aplicarFiltros();
      }
    });
  }

  agregarAlCarrito(prod: any): void {
    console.log('🛒 Añadir al carrito:', prod.name);
    // TODO: conectar con CartService
  }
}
