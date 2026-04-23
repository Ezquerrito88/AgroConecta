import { Component, OnInit, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Sidebar } from '../sidebar/sidebar';
import { ProductoService } from '../../core/services/producto.service';
import { CategoryService } from '../../core/services/category';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-editar-producto',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, Sidebar, MatSelectModule, MatFormFieldModule],
  templateUrl: './editar-producto.html',
  styleUrls: ['./editar-producto.css'],
  encapsulation: ViewEncapsulation.None
})
export class EditarProducto implements OnInit {
  sidebarOpen = false;
  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }

  user: any = null;
  producto: any = {};
  categorias: any[] = [];
  loading = true;
  saving = false;
  isDragging = false;
  showDeleteModal = false;
  deleting = false;

  newImages: File[] = [];
  newImagePreviews: string[] = [];

  dragIndex = -1;
  dragOverIndex = -1;

  unidades = ['kg', 'g', 'l', 'ml', 'ud', 'docena', 'manojo', 'caja', 'bandeja', 'saco', 'pack'];

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private productoService: ProductoService,
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.loadCategorias();
    this.loadProducto(Number(id));
    this.user = this.authService.getCurrentUser();
  }

  loadProducto(id: number): void {
    this.productoService.getProducto(id).subscribe({
      next: (data: any) => {
        this.producto = {
          ...data,
          images: data.images?.map((img: any) => ({
            id: img.id,
            url: img.image_url ?? `${environment.storageUrl}/${img.image_path}`
          })) ?? []
        };
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; }
    });
  }

  loadCategorias(): void {
    this.categoryService.getCategorias().subscribe({
      next: (data: any[]) => this.categorias = data,
      error: () => { }
    });
  }

  get totalImages(): number {
    return (this.producto.images?.length || 0) + this.newImages.length;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.totalImages < 6) this.isDragging = true;
  }

  onDragLeave(): void { this.isDragging = false; }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files) this.processFiles(files);
  }

  onImageSelected(event: any): void {
    this.processFiles(event.target.files);
    event.target.value = '';
  }

  private processFiles(files: FileList): void {
    const disponibles = 6 - this.totalImages;
    const toProcess = Math.min(files.length, disponibles);

    for (let i = 0; i < toProcess; i++) {
      const file = files[i];
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) continue;
      if (file.size > 2 * 1024 * 1024) continue;

      this.newImages.push(file);
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.newImagePreviews.push(e.target.result);
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  removeNewImage(index: number): void {
    this.newImages.splice(index, 1);
    this.newImagePreviews.splice(index, 1);
  }

  deleteImage(imageId: number): void {
    this.productoService.deleteImage(this.producto.id, imageId).subscribe({
      next: () => {
        this.producto.images = this.producto.images.filter((img: any) => img.id !== imageId);
        this.cdr.detectChanges();
      }
    });
  }

  onThumbDragStart(index: number): void { this.dragIndex = index; }

  onThumbDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    this.dragOverIndex = index;
  }

  onThumbDragLeave(): void { this.dragOverIndex = -1; }

  onThumbDrop(targetIndex: number): void {
    if (this.dragIndex === -1 || this.dragIndex === targetIndex) return;

    const imgs = [...this.producto.images];
    const [moved] = imgs.splice(this.dragIndex, 1);
    imgs.splice(targetIndex, 0, moved);
    this.producto.images = imgs;

    this.dragIndex = -1;
    this.dragOverIndex = -1;
    this.cdr.detectChanges();
  }

  onThumbDragEnd(): void {
    this.dragIndex = -1;
    this.dragOverIndex = -1;
  }

  guardar(): void {
    this.saving = true;
    const formData = new FormData();
    formData.append('_method', 'PUT');
    formData.append('name', this.producto.name ?? '');
    formData.append('description', this.producto.description ?? '');
    formData.append('short_description', this.producto.short_description ?? '');
    formData.append('price', this.producto.price);
    formData.append('unit', this.producto.unit);
    formData.append('stock_quantity', this.producto.stock_quantity);
    formData.append('category_id', this.producto.category_id);

    this.producto.images.forEach((img: any, i: number) => {
      formData.append(`image_order[${i}]`, img.id);
    });

    this.newImages.forEach(img => formData.append('images[]', img));

    this.productoService.updateProducto(this.producto.id, formData).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/agricultor/mis-productos']);
      },
      error: () => { this.saving = false; }
    });
  }

  eliminar(): void { this.showDeleteModal = true; }
  cancelarEliminar(): void { this.showDeleteModal = false; }

  confirmarEliminar(): void {
    this.deleting = true;
    this.productoService.deleteProducto(this.producto.id).subscribe({
      next: () => {
        this.deleting = false;
        this.showDeleteModal = false;
        this.router.navigate(['/agricultor/mis-productos']);
      },
      error: () => {
        this.deleting = false;
        this.showDeleteModal = false;
      }
    });
  }
}
