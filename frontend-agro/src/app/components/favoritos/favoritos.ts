import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { ProductoService } from '../../core/services/producto.service';
import { CartService } from '../../core/services/cart.service';
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

  productos: any[] = [];
  productosFiltrados: any[] = [];
  isLoading = true;

  filtros = { categoria: 'todas', orden: 'novedad' };
  minPrice = 0;
  maxPrice = 100;

  constructor(
    private productoService: ProductoService,
    private cartService: CartService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    Promise.resolve().then(() => this.cargarFavoritos());
  }

  // ✅ Usa image_url del backend (Azure), fallback limpio
  getImagenUrl(prod: any): string {
    if (prod?.images?.length > 0) {
      const img = prod.images[0];
      if (img.image_url) return img.image_url;
      const path = img.image_path;
      if (!path) return 'assets/placeholder.png';
      if (path.startsWith('http')) return path;
      return `${environment.storageUrl}/${path}`;
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

  aplicarFiltros(): void {
    let result = [...this.productos];

    if (this.filtros.categoria !== 'todas') {
      result = result.filter(p =>
        p.category?.name?.toLowerCase() === this.filtros.categoria ||
        p.category?.slug?.toLowerCase() === this.filtros.categoria
      );
    }

    result = result.filter(p =>
      +p.price >= this.minPrice && +p.price <= this.maxPrice
    );

    if (this.filtros.orden === 'precio_asc') result.sort((a, b) => +a.price - +b.price);
    if (this.filtros.orden === 'precio_desc') result.sort((a, b) => +b.price - +a.price);
    if (this.filtros.orden === 'novedad') result.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    this.productosFiltrados = result;
    this.cdr.detectChanges();
  }

  limpiarFiltros(): void {
    this.filtros = { categoria: 'todas', orden: 'novedad' };
    this.minPrice = 0;
    this.maxPrice = 100;
    this.aplicarFiltros();
  }

  quitarFavorito(prod: any): void {
    const token = localStorage.getItem('token');
    if (!token) { this.router.navigate(['/login']); return; }

    const index = this.productos.indexOf(prod);
    this.productos = this.productos.filter(p => p.id !== prod.id);
    this.productosFiltrados = this.productosFiltrados.filter(p => p.id !== prod.id);

    this.productoService.toggleFavorite(prod.id).subscribe({
      error: () => {
        this.productos.splice(index, 0, prod);
        this.aplicarFiltros();
      }
    });
  }

  agregarAlCarrito(prod: any): void {
    this.cartService.addToCart({
      id: Number(prod.id),
      name: prod.name,
      farmer: prod?.farmer?.user?.name || prod?.farmer?.full_name || prod?.farmer?.name || 'Agricultor local',
      farmerId: Number(prod?.farmer?.user_id ?? prod?.farmer?.id ?? 0),
      price: Number(prod.price),
      unit: prod.unit ?? 'ud',
      quantity: 1,
      image: this.getImagenUrl(prod)
    });
  }
}
