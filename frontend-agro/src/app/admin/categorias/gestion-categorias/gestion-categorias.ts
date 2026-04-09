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

  // Modal
  modalVisible = false;
  modalType    = ''; // 'create' | 'edit' | 'delete'
  selectedCat  = signal<any>(null);

  // Formulario
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
    this.imageFile = file;
    const reader   = new FileReader();
    reader.onload  = (e: any) => this.imagePreview = e.target.result;
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
      next: () => { this.closeModal(); this.loadCategories(); },
      error: () => { this.actionLoading = false; }
    });
  }

  deleteCategory(): void {
    this.actionLoading = true;
    this.adminService.deleteCategory(this.selectedCat().id).subscribe({
      next: () => { this.closeModal(); this.loadCategories(); },
      error: () => { this.actionLoading = false; }
    });
  }
}