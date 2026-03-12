import { Component, OnInit, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../sidebar/sidebar';
import { ProductoService } from '../../core/services/producto.service';

@Component({
  selector: 'app-mis-productos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, Sidebar, CurrencyPipe],
  templateUrl: './mis-productos.html',
  styleUrls: ['./mis-productos.css'],
  encapsulation: ViewEncapsulation.None
})
export class MisProductos implements OnInit {

  productos: any[] = [];
  loading = true;

  // Skeleton loader
  skeletonItems = Array(6);

  // KPIs globales
  totalProductos = 0;
  disponibles    = 0;
  atencion       = 0;
  agotados       = 0;
  pocoStock      = 0;
  unidadesVendidas = 0;

  // Paginación
  currentPage = 1;
  lastPage    = 1;
  perPage     = 12;

  // Paginación — array reactivo derivado de lastPage
  get pageItems(): number[] {
    return Array.from({ length: this.lastPage }, (_, i) => i + 1);
  }

  // Filtros
  sortOrder = 'recent';

  constructor(
    private productService: ProductoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProductos();
  }

  loadProductos(): void {
    this.loading = true;
    this.productService.getMisProductos(this.currentPage, this.perPage).subscribe({
      next: (res: any) => {
        // KPIs globales del backend
        this.totalProductos  = res.kpis.total;
        this.agotados        = res.kpis.agotados;
        this.pocoStock       = res.kpis.pocoStock;
        this.disponibles     = res.kpis.disponibles;
        this.atencion        = this.agotados + this.pocoStock;

        // Productos paginados
        this.productos = res.productos.data.map((p: any) => ({
          ...p,
          stockPct: p.stock > 0 ? Math.min(Math.round((p.stock / p.max_stock) * 100), 100) : 0
        }));
        this.lastPage = res.productos.last_page;
        this.loading  = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage) return;
    this.currentPage = page;
    this.loadProductos();
  }

  stockBarClass(pct: number): string {
    if (pct <= 10) return 'low';
    if (pct <= 30) return 'mid';
    return '';
  }

  onSortChange(): void {
    switch (this.sortOrder) {
      case 'recent':
        this.productos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        this.productos.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'price_high':
        this.productos.sort((a, b) => b.price - a.price);
        break;
      case 'price_low':
        this.productos.sort((a, b) => a.price - b.price);
        break;
    }
  }
}
