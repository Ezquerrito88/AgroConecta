import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminService } from '../services/admin';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-editar-producto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './editar-producto.html',
  styleUrl: './editar-producto.css'
})
export class EditarProducto implements OnInit {
  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private adminService = inject(AdminService);
  private authService  = inject(AuthService);
  private cdr          = inject(ChangeDetectorRef);

  producto: any = {};
  loading  = true;
  saving   = false;
  deleting = false;
  showDeleteModal = false;

  user: any = null;

  newImages: File[]          = [];
  newImagePreviews: string[] = [];

  isDragging    = false;
  dragIndex     = -1;
  dragOverIndex = -1;

  categorias: any[] = [];
  unidades = ['kg', 'g', 'unidad', 'caja', 'bolsa', 'litro', 'docena', 'manojo'];

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    const id  = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProduct(id);
    this.loadCategorias();
  }

  loadProduct(id: number): void {
    this.loading = true;
    this.adminService.getProductById(id).subscribe({
      next: (p) => {
        this.producto = p;
        this.producto.category_id = p.category?.id ?? p.category_id;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar producto:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadCategorias(): void {
    this.adminService.getCategories().subscribe({
      next: (res) => {
        this.categorias = res.data ?? res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar categorías:', err)
    });
  }

  guardar(): void {
    this.saving = true;
    const payload = {
      name:              this.producto.name,
      description:       this.producto.description,
      short_description: this.producto.short_description,
      price:             this.producto.price,
      unit:              this.producto.unit,
      stock_quantity:    this.producto.stock_quantity,
      season_end:        this.producto.season_end,
      category_id:       this.producto.category_id,
      moderation_status: this.producto.moderation_status,
      rejection_reason:  this.producto.rejection_reason ?? null,  // ← AÑADIDO
    };

    this.adminService.updateProduct(this.producto.id, payload).subscribe({
      next: () => {
        if (this.newImages.length > 0) {
          this.uploadImages();
        } else {
          this.saving = false;
          this.router.navigate(['/admin/productos']);
        }
      },
      error: () => { this.saving = false; }
    });
  }

  uploadImages(): void {
    const fd = new FormData();
    this.newImages.forEach(f => fd.append('images[]', f));
    this.adminService.uploadProductImages(this.producto.id, fd).subscribe({
      next:  () => { this.saving = false; this.router.navigate(['/admin/productos']); },
      error: () => { this.saving = false; }
    });
  }

  eliminar(): void         { this.showDeleteModal = true; }
  cancelarEliminar(): void { this.showDeleteModal = false; }

  confirmarEliminar(): void {
    this.deleting = true;
    this.adminService.deleteProduct(this.producto.id).subscribe({
      next:  () => this.router.navigate(['/admin/productos']),
      error: () => { this.deleting = false; }
    });
  }

  onImageSelected(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    this.addImages(files);
  }

  addImages(files: File[]): void {
    const available = 6 - (this.producto.images?.length ?? 0) - this.newImages.length;
    files.slice(0, available).forEach(file => {
      this.newImages.push(file);
      const reader = new FileReader();
      reader.onload = e => {
        this.newImagePreviews.push(e.target!.result as string);
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    });
  }

  removeNewImage(i: number): void {
    this.newImages.splice(i, 1);
    this.newImagePreviews.splice(i, 1);
  }

  deleteImage(imgId: number): void {
    this.adminService.deleteProductImage(this.producto.id, imgId).subscribe({
      next: () => {
        this.producto.images = this.producto.images.filter((img: any) => img.id !== imgId);
        this.cdr.detectChanges();
      }
    });
  }

  onDragOver(e: DragEvent): void  { e.preventDefault(); this.isDragging = true; }
  onDragLeave(): void              { this.isDragging = false; }
  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragging = false;
    this.addImages(Array.from(e.dataTransfer?.files ?? []));
  }

  onThumbDragStart(i: number): void             { this.dragIndex = i; }
  onThumbDragLeave(): void                       { this.dragOverIndex = -1; }
  onThumbDragEnd(): void                         { this.dragIndex = -1; this.dragOverIndex = -1; }
  onThumbDragOver(e: DragEvent, i: number): void { e.preventDefault(); this.dragOverIndex = i; }

  onThumbDrop(targetIndex: number): void {
    if (this.dragIndex === -1 || this.dragIndex === targetIndex) return;
    const imgs  = [...this.producto.images];
    const moved = imgs.splice(this.dragIndex, 1)[0];
    imgs.splice(targetIndex, 0, moved);
    this.producto.images = imgs;
    this.dragIndex       = -1;
    this.dragOverIndex   = -1;
  }
}