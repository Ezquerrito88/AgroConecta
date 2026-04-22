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

  products      = signal<any[]>([]);
  loading       = signal(true);
  pagination    = signal<any>(null);

  pendingCount  = signal(0);
  approvedCount = signal(0);
  rejectedCount = signal(0);

  search       = '';
  statusFilter = '';
  currentPage  = 1;

  modalVisible    = false;
  modalType       = '';
  selectedProduct = signal<any>(null);
  actionLoading   = false;

  ngOnInit(): void {
    this.loadProducts();
    this.loadCounts();
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
        if (res.status_counts) {
          this.pendingCount.set(res.status_counts.pending   ?? 0);
          this.approvedCount.set(res.status_counts.approved ?? 0);
          this.rejectedCount.set(res.status_counts.rejected ?? 0);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadCounts(): void {
    const statuses = ['pending', 'approved', 'rejected'] as const;
    const signals  = {
      pending:  this.pendingCount,
      approved: this.approvedCount,
      rejected: this.rejectedCount,
    };
    statuses.forEach(status => {
      this.adminService.getProducts({ status, per_page: 1 }).subscribe({
        next: (res) => signals[status].set(res.total ?? 0)
      });
    });
  }

  onSearch():                void { this.currentPage = 1; this.loadProducts(); }
  onStatusFilter(s: string): void { this.statusFilter = s; this.currentPage = 1; this.loadProducts(); }
  goToPage(p: number):       void { this.currentPage = p; this.loadProducts(); }

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
        this.loadCounts();
      },
      error: () => { this.actionLoading = false; }
    });
  }

  getStatusClass(s: string): string {
    return ({ approved: 'status-approved', pending: 'status-pending', rejected: 'status-rejected' } as any)[s] ?? '';
  }
  getStatusLabel(s: string): string {
    return ({ approved: 'Aprobado', pending: 'Pendiente', rejected: 'Rechazado' } as any)[s] ?? s;
  }
  getStatusIcon(s: string): string {
    return ({ approved: 'check_circle', pending: 'schedule', rejected: 'cancel' } as any)[s] ?? 'help';
  }

  getPages(): (number | string)[] {
    const p = this.pagination();
    if (!p) return [];

    const total   = p.last_page;
    const current = this.currentPage;
    const pages: (number | string)[] = [];

    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    pages.push(1);
    if (current > 3)          pages.push('...');

    const start = Math.max(2, current - 1);
    const end   = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (current < total - 2)  pages.push('...');
    pages.push(total);

    return pages;
  }

  getImageUrl(product: any): string {
    return product.images?.[0]?.url ?? '';
  }

  getInitials(name: string): string {
    return name?.charAt(0)?.toUpperCase() ?? '?';
  }
}