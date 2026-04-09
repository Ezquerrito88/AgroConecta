import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin';

@Component({
  selector: 'app-gestion-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-usuarios.html',
  styleUrl: './gestion-usuarios.css'
})
export class GestionUsuarios implements OnInit {
  private adminService = inject(AdminService);

  users      = signal<any[]>([]);
  loading    = signal(true);
  pagination = signal<any>(null);

  search      = '';
  roleFilter  = '';   // '' | 'admin' | 'farmer' | 'buyer'
  currentPage = 1;

  modalVisible  = false;
  modalType     = '';
  selected      = signal<any>(null);
  actionLoading = false;
  showPassword  = false;

  // Vista activa: qué columnas mostrar
  get viewMode(): 'all' | 'farmer' | 'buyer' | 'admin' {
    return (this.roleFilter as any) || 'all';
  }

  editForm: any = {};

  ngOnInit(): void { this.load(); }

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

  onSearch():                  void { this.currentPage = 1; this.load(); }
  onRoleFilter(role: string):  void { this.roleFilter = role; this.currentPage = 1; this.load(); }
  goToPage(p: number):         void { this.currentPage = p; this.load(); }

  // ── Modales ──
  openEdit(u: any): void {
    this.selected.set(u);
    this.editForm = {
      name:        u.name        ?? '',
      email:       u.email       ?? '',
      phone:       u.phone       ?? '',
      address:     u.address     ?? '',
      role:        u.role        ?? 'buyer',
      is_active:   u.is_active   ?? true,
      password:    '',
      // farmer
      farm_name:   u.farmer?.farm_name   ?? '',
      city:        u.farmer?.city        ?? '',
      is_verified: u.farmer?.is_verified ?? false,
      bio:         u.farmer?.bio         ?? '',
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
        next: () => { this.closeModal(); this.load(); },
        error: () => { this.actionLoading = false; }
      });
    }

    if (this.modalType === 'toggle') {
      this.adminService.toggleActive(u.id).subscribe({
        next: () => { this.closeModal(); this.load(); },
        error: () => { this.actionLoading = false; }
      });
    }

    if (this.modalType === 'edit') {
      const payload: any = { ...this.editForm };
      if (!payload.password?.trim()) delete payload.password;
      this.adminService.updateUser(u.id, payload).subscribe({
        next: () => { this.closeModal(); this.load(); },
        error: () => { this.actionLoading = false; }
      });
    }
  }

  isEmailVerified(u: any): boolean { return !!u.email_verified_at; }

  getRoleBadgeClass(role: string): string {
    return { admin: 'badge-admin', farmer: 'badge-farmer', buyer: 'badge-buyer' }[role] || '';
  }
  getRoleLabel(role: string): string {
    return { admin: 'Admin', farmer: 'Agricultor', buyer: 'Comprador' }[role] || role;
  }
  getRoleIcon(role: string): string {
    return { admin: 'shield_person', farmer: 'agriculture', buyer: 'shopping_bag' }[role] || 'person';
  }

  getPages(): number[] {
    const p = this.pagination();
    return p ? Array.from({ length: p.last_page }, (_, i) => i + 1) : [];
  }
}