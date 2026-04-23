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
  sidebarOpen = false;

  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }

  // KPIs
  totalProductos = 0;
  disponibles = 0;
  atencion = 0;
  agotados = 0;
  pocoStock = 0;
  unidadesVendidas = 0;

  // Paginación
  currentPage = 1;
  lastPage = 1;
  perPage = 12;

  // Orden
  sortOrder = 'recent';

  constructor(
    private productService: ProductoService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadProductos();
  }

  /**
   * Carga los productos llamando al servicio con paginación y ordenamiento
   */
  loadProductos(): void {
    this.loading = true;

    // Usamos las variables de clase para la petición
    this.productService.getMisProductos(this.currentPage, this.perPage, this.sortOrder).subscribe({
      next: (res: any) => {
        // Mapeo de KPIs desde la respuesta del Backend
        this.totalProductos = res.kpis.total;
        this.agotados = res.kpis.agotados;
        this.pocoStock = res.kpis.pocoStock;
        this.disponibles = res.kpis.disponibles;
        this.atencion = this.agotados + this.pocoStock;
        this.unidadesVendidas = 0;

        // Procesamiento de productos paginados (res.productos.data)
        const data = res.productos.data || [];

        this.productos = data.map((p: any) => {
          const stock = p.stock ?? p.stock_quantity ?? 0;
          const maxStock = p.max_stock ?? 100;
          return {
            ...p,
            stock,
            stockPct: stock > 0 ? Math.min(Math.round((stock / maxStock) * 100), 100) : 0
          };
        });

        // Actualizamos info de paginación
        this.currentPage = res.productos.current_page;
        this.lastPage = res.productos.last_page;

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar productos:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Gestiona el cambio de página
   */
  changePage(newPage: number): void {
    if (newPage >= 1 && newPage <= this.lastPage) {
      this.currentPage = newPage;
      this.loadProductos();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onSortChange(): void {
    this.currentPage = 1; // Al cambiar orden, volvemos a la página 1
    this.loadProductos();
  }

  goToEdit(productId: number): void {
    this.router.navigate(['/agricultor/mis-productos/editar', productId]);
  }

  stockBarClass(pct: number): string {
    if (pct <= 15) return 'low';
    if (pct <= 40) return 'mid';
    return 'high';
  }

  getStatusClass(status: string): string {
    const n = status?.toLowerCase()?.trim();
    switch (n) {
      case 'aprobado': case 'approved': return 'approved';
      case 'pendiente': case 'pending': return 'pending';
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