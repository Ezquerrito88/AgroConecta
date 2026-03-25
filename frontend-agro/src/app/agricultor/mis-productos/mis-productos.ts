import { Component, OnInit, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '../sidebar/sidebar';
import { ProductoService } from '../../core/services/producto.service';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-mis-productos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, Sidebar, CurrencyPipe],
  templateUrl: './mis-productos.html',
  styleUrls: ['./mis-productos.css'],
  encapsulation: ViewEncapsulation.None
})
export class MisProductos implements OnInit {

  user: any = null;
  productos: any[] = [];
  loading = true;

  totalProductos = 0;
  disponibles = 0;
  atencion = 0;
  agotados = 0;
  pocoStock = 0;
  unidadesVendidas = 0;

  currentPage = 1;
  lastPage = 1;
  perPage = 12;

  sortOrder = 'recent';

  constructor(
    private productService: ProductoService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadProductos();
  }

  loadProductos(): void {
    this.loading = true;
    this.productService.getMisProductos(this.currentPage, this.perPage).subscribe({
      next: (res: any) => {
        this.totalProductos = res.kpis.total;
        this.agotados      = res.kpis.agotados;
        this.pocoStock     = res.kpis.pocoStock;
        this.disponibles   = res.kpis.disponibles;
        this.atencion      = this.agotados + this.pocoStock;
        this.unidadesVendidas = 0;

        this.productos = res.productos.data.map((p: any) => {
          // ← FIX: BD usa 'stock_quantity', normalizamos a 'stock'
          const stock    = p.stock ?? p.stock_quantity ?? 0;
          const maxStock = p.max_stock ?? 100;
          return {
            ...p,
            stock,   // ← garantiza que siempre exista p.stock en el template
            stockPct: stock > 0 ? Math.min(Math.round((stock / maxStock) * 100), 100) : 0
          };
        });

        this.lastPage = res.productos.last_page;
        this.loading  = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goToEdit(productId: number): void {
    this.router.navigate(['/agricultor/mis-productos/editar', productId]);
  }

  stockBarClass(pct: number): string {
    if (pct <= 15) return 'low';
    if (pct <= 40) return 'mid';
    return 'high';
  }

  onSortChange(): void {
    switch (this.sortOrder) {
      case 'recent':
        this.productos.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case 'price_high':
        this.productos.sort((a, b) => b.price - a.price);
        break;
      case 'price_low':
        this.productos.sort((a, b) => a.price - b.price);
        break;
    }
    this.cdr.detectChanges();
  }

  getStatusClass(status: string): string {
    const n = status?.toLowerCase()?.trim();
    switch (n) {
      case 'aprobado': case 'approved':  return 'approved';
      case 'pendiente': case 'pending':  return 'pending';
      case 'rechazado': case 'rejected': return 'rejected';
      default: return 'pending';
    }
  }

  getStatusLabel(status: string): string {
    const n = status?.toLowerCase()?.trim();
    const labels: { [key: string]: string } = {
      'aprobado': 'Aprobado', 'approved': 'Aprobado',
      'pendiente': 'Pendiente', 'pending': 'Pendiente',
      'rechazado': 'Rechazado', 'rejected': 'Rechazado'
    };
    return labels[n] ?? 'Pendiente';
  }
}
