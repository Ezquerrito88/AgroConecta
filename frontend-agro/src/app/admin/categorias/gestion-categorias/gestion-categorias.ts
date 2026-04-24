import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin';

@Component({
  selector: 'app-gestion-categorias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-categorias.html',
  styleUrl: './gestion-categorias.css'
})
export class GestionCategorias implements OnInit {
  private adminService = inject(AdminService);

  categories    = signal<any[]>([]);
  loading       = signal(true);
  actionLoading = false;

  modalVisible = false;
  modalType    = '';
  selectedCat  = signal<any>(null);

  form = { name: '', description: '', icon: '' };
  imageFile: File | null = null;
  imagePreview = '';

  ngOnInit(): void { this.loadCategories(); }

  loadCategories(): void {
    this.loading.set(true);
    this.adminService.getCategories().subscribe({
      next: (res) => { this.categories.set(res); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCreate(): void {
    this.form         = { name: '', description: '', icon: '' };
    this.imageFile    = null;
    this.imagePreview = '';
    this.selectedCat.set(null);
    this.modalType    = 'create';
    this.modalVisible = true;
  }

  openEdit(cat: any): void {
    this.form         = { name: cat.name, description: cat.description || '', icon: cat.icon || '' };
    this.imageFile    = null;
    this.imagePreview = cat.image || '';
    this.selectedCat.set(cat);
    this.modalType    = 'edit';
    this.modalVisible = true;
  }

  openDelete(cat: any): void {
    this.selectedCat.set(cat);
    this.modalType    = 'delete';
    this.modalVisible = true;
  }

  closeModal(): void {
    this.modalVisible  = false;
    this.actionLoading = false;
    this.selectedCat.set(null);
  }

  onImageChange(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    this.imageFile    = file;
    const reader      = new FileReader();
    reader.onload     = (e: any) => this.imagePreview = e.target.result;
    reader.readAsDataURL(file);
  }

  saveCategory(): void {
    this.actionLoading = true;
    const fd = new FormData();
    fd.append('name',        this.form.name);
    fd.append('description', this.form.description);
    fd.append('icon',        this.form.icon);
    if (this.imageFile) fd.append('image', this.imageFile);

    const action$ = this.modalType === 'create'
      ? this.adminService.createCategory(fd)
      : this.adminService.updateCategory(this.selectedCat().id, fd);

    action$.subscribe({
      next:  () => { this.closeModal(); this.loadCategories(); },
      error: () => { this.actionLoading = false; }
    });
  }

  deleteCategory(): void {
    this.actionLoading = true;
    this.adminService.deleteCategory(this.selectedCat().id).subscribe({
      next:  () => { this.closeModal(); this.loadCategories(); },
      error: () => { this.actionLoading = false; }
    });
  }

  // ── Quick stats ──────────────────────────────────
  getTotalProducts(): number {
    return this.categories().reduce((sum, c) => sum + (c.products_count ?? 0), 0);
  }

  getCategoriesUsed(): number {
    return this.categories().filter(c => (c.products_count ?? 0) > 0).length;
  }

  getCategoriesUnused(): number {
    return this.categories().filter(c => (c.products_count ?? 0) === 0).length;
  }

  // ── Placeholders de color ────────────────────────
  getPlaceholderGradient(index: number): string {
    const gradients = [
      'linear-gradient(135deg, #f0fdf4, #dcfce7)',
      'linear-gradient(135deg, #eff6ff, #dbeafe)',
      'linear-gradient(135deg, #fefce8, #fef9c3)',
      'linear-gradient(135deg, #fdf4ff, #f3e8ff)',
      'linear-gradient(135deg, #fff7ed, #ffedd5)',
      'linear-gradient(135deg, #f0fdfa, #ccfbf1)',
    ];
    return gradients[index % gradients.length];
  }

  getPlaceholderColor(index: number): string {
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'];
    return colors[index % colors.length];
  }

  openSidebar(): void {
    document.dispatchEvent(new CustomEvent('open-admin-sidebar'));
  }
}