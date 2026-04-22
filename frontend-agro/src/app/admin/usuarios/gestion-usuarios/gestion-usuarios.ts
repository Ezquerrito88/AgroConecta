import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../services/admin';

@Component({
  selector: 'app-gestion-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './gestion-usuarios.html',
  styleUrl: './gestion-usuarios.css'
})
export class GestionUsuarios implements OnInit {
  private adminService = inject(AdminService);

  users      = signal<any[]>([]);
  loading    = signal(true);
  pagination = signal<any>(null);

  // Contadores por rol (se acumulan de todas las páginas)
  private roleCounts: Record<string, number> = { farmer: 0, buyer: 0, admin: 0 };

  search      = '';
  roleFilter  = '';
  currentPage = 1;

  modalVisible  = false;
  modalType     = '';
  selected      = signal<any>(null);
  actionLoading = false;
  showPassword  = false;

  get viewMode(): 'all' | 'farmer' | 'buyer' | 'admin' {
    return (this.roleFilter as any) || 'all';
  }

  editForm: any = {};

  ngOnInit(): void {
    this.loadCounts();
    this.load();
  }

  // Carga los contadores globales (sin filtro de rol)
  loadCounts(): void {
    this.adminService.getUsers({ page: 1, per_page: 1 }).subscribe({
      next: (res) => {
        // Si el backend devuelve totales por rol úsalos,
        // si no hacemos 3 llamadas ligeras
        if (res.counts) {
          this.roleCounts = res.counts;
        } else {
          (['farmer', 'buyer', 'admin'] as const).forEach(role => {
            this.adminService.getUsers({ page: 1, per_page: 1, role }).subscribe({
              next: (r) => { this.roleCounts[role] = r.total ?? 0; }
            });
          });
        }
      }
    });
  }

  countByRole(role: string): number {
    return this.roleCounts[role] ?? 0;
  }

  load(): void {
    this.loading.set(true);
    const params: any = { page: this.currentPage };
    if (this.search)     params.search = this.search;
    if (this.roleFilter) params.role   = this.roleFilter;

    this.adminService.getUsers(params).subscribe({
      next: (res) => {
        this.users.set(res.data);
        this.pagination.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch():                 void { this.currentPage = 1; this.load(); }
  onRoleFilter(role: string): void { this.roleFilter = role; this.currentPage = 1; this.load(); }
  goToPage(p: number):        void { this.currentPage = p; this.load(); }

  // ── Modales ──
  openEdit(u: any): void {
    this.selected.set(u);
    this.editForm = {
      name:        u.name               ?? '',
      email:       u.email              ?? '',
      phone:       u.phone              ?? '',
      address:     u.address            ?? '',
      role:        u.role               ?? 'buyer',
      is_active:   u.is_active          ?? true,
      password:    '',
      farm_name:   u.farmer?.farm_name  ?? '',
      city:        u.farmer?.city       ?? '',
      is_verified: u.farmer?.is_verified ?? false,
      bio:         u.farmer?.bio        ?? '',
    };
    this.showPassword = false;
    this.modalType    = 'edit';
    this.modalVisible = true;
  }

  openDelete(u: any): void { this.selected.set(u); this.modalType = 'delete'; this.modalVisible = true; }
  openToggle(u: any): void { this.selected.set(u); this.modalType = 'toggle'; this.modalVisible = true; }

  closeModal(): void {
    this.modalVisible  = false;
    this.selected.set(null);
    this.actionLoading = false;
    this.showPassword  = false;
  }

  confirmAction(): void {
    this.actionLoading = true;
    const u = this.selected();

    if (this.modalType === 'delete') {
      this.adminService.deleteUser(u.id).subscribe({
        next:  () => { this.closeModal(); this.load(); this.loadCounts(); },
        error: () => { this.actionLoading = false; }
      });
    }

    if (this.modalType === 'toggle') {
      this.adminService.toggleActive(u.id).subscribe({
        next:  () => { this.closeModal(); this.load(); },
        error: () => { this.actionLoading = false; }
      });
    }

    if (this.modalType === 'edit') {
      const payload: any = { ...this.editForm };
      if (!payload.password?.trim()) delete payload.password;
      this.adminService.updateUser(u.id, payload).subscribe({
        next:  () => { this.closeModal(); this.load(); this.loadCounts(); },
        error: () => { this.actionLoading = false; }
      });
    }
  }

  isEmailVerified(u: any): boolean { return !!u.email_verified_at; }

  getRoleBadgeClass(role: string): string {
    return ({ admin: 'badge-admin', farmer: 'badge-farmer', buyer: 'badge-buyer' } as any)[role] ?? '';
  }
  getRoleLabel(role: string): string {
    return ({ admin: 'Admin', farmer: 'Agricultor', buyer: 'Comprador' } as any)[role] ?? role;
  }
  getRoleIcon(role: string): string {
    return ({ admin: 'shield_person', farmer: 'agriculture', buyer: 'shopping_bag' } as any)[role] ?? 'person';
  }

  getPages(): number[] {
    const p = this.pagination();
    return p ? Array.from({ length: p.last_page }, (_, i) => i + 1) : [];
  }
}