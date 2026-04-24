import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../services/admin';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class AdminDashboard implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);

  user = this.authService.getCurrentUser();
  today = new Date();
  isLoading = true;

  stats = signal<any>(null);
  recentUsers = signal<any[]>([]);
  latestProds = signal<any[]>([]);

  ngOnInit(): void { this.loadStats(); }

  loadStats(): void {
    this.isLoading = true;
    this.adminService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.recentUsers.set(data.recent_users ?? []);
        this.latestProds.set(data.products?.latest ?? []);
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  getRoleBadgeClass(role: string): string {
    return { admin: 'badge-admin', farmer: 'badge-farmer', buyer: 'badge-buyer' }[role] || '';
  }
  getRoleLabel(role: string): string {
    return { admin: 'Admin', farmer: 'Agricultor', buyer: 'Comprador' }[role] || role;
  }
  getRoleIcon(role: string): string {
    return { admin: 'shield_person', farmer: 'agriculture', buyer: 'shopping_bag' }[role] || 'person';
  }
  getStatusClass(status: string): string {
    return { approved: 'status-approved', pending: 'status-pending', rejected: 'status-rejected' }[status] || '';
  }
  getStatusLabel(status: string): string {
    return { approved: 'Aprobado', pending: 'Pendiente', rejected: 'Rechazado' }[status] || status;
  }
  getStatusIcon(status: string): string {
    return { approved: 'check_circle', pending: 'schedule', rejected: 'cancel' }[status] || 'help';
  }
  getProductThumb(p: any): string | null {
    const img = p.images?.[0];
    return img?.url ?? img?.image_url ?? img?.path ?? null;
  }

  openSidebar(): void {
    document.dispatchEvent(new CustomEvent('open-admin-sidebar'));
  }
}