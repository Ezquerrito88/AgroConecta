import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin';

@Component({
  selector: 'app-gestion-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './gestion-productos.html',
  styleUrl: './gestion-productos.css'
})
export class GestionProductos implements OnInit {
  private adminService = inject(AdminService);
  private router       = inject(Router);

  products     = signal<any[]>([]);
  loading      = signal(true);
  pagination   = signal<any>(null);
  pendingCount = signal(0);

  search       = '';
  statusFilter = '';
  currentPage  = 1;

  modalVisible    = false;
  modalType       = '';
  selectedProduct = signal<any>(null);
  actionLoading   = false;

  ngOnInit(): void {
    this.loadProducts();
    this.loadPendingCount();
  }

  loadProducts(): void {
    this.loading.set(true);
    const params: any = { page: this.currentPage };
    if (this.search)       params.search = this.search;
    if (this.statusFilter) params.status = this.statusFilter;

    this.adminService.getProducts(params).subscribe({
      next: (res) => {
        this.products.set(res.data);
        this.pagination.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadPendingCount(): void {
    this.adminService.getProducts({ status: 'pending', per_page: 1 }).subscribe({
      next: (res) => this.pendingCount.set(res.total ?? 0)
    });
  }

  onSearch():                void { this.currentPage = 1; this.loadProducts(); }
  onStatusFilter(s: string): void { this.statusFilter = s; this.currentPage = 1; this.loadProducts(); }
  goToPage(p: number):       void { this.currentPage = p; this.loadProducts(); }

  // Navega a editar al hacer click en la fila
  navigateToEdit(product: any): void {
    this.router.navigate(['/admin/productos', product.id, 'editar']);
  }

  openModal(type: string, product: any, event?: Event): void {
    event?.stopPropagation();
    this.modalType = type;
    this.selectedProduct.set(product);
    this.modalVisible = true;
  }

  closeModal(): void {
    this.modalVisible  = false;
    this.selectedProduct.set(null);
    this.actionLoading = false;
  }

  confirmAction(): void {
    this.actionLoading = true;
    const id = this.selectedProduct().id;

    const action$ =
      this.modalType === 'approve' ? this.adminService.approveProduct(id) :
      this.modalType === 'reject'  ? this.adminService.rejectProduct(id)  :
                                     this.adminService.deleteProduct(id);

    action$.subscribe({
      next: () => {
        this.closeModal();
        this.loadProducts();
        this.loadPendingCount();
      },
      error: () => { this.actionLoading = false; }
    });
  }

  getStatusClass(s: string): string {
    return { approved: 'status-approved', pending: 'status-pending', rejected: 'status-rejected' }[s] || '';
  }
  getStatusLabel(s: string): string {
    return { approved: 'Aprobado', pending: 'Pendiente', rejected: 'Rechazado' }[s] || s;
  }
  getStatusIcon(s: string): string {
    return { approved: 'check_circle', pending: 'schedule', rejected: 'cancel' }[s] || 'help';
  }

  getPages(): number[] {
    const p = this.pagination();
    return p ? Array.from({ length: p.last_page }, (_, i) => i + 1) : [];
  }

  getImageUrl(product: any): string {
    const img = product.images?.[0];
    return img?.url ?? '';
  }

  getInitials(name: string): string {
    return name?.charAt(0)?.toUpperCase() ?? '?';
  }
}