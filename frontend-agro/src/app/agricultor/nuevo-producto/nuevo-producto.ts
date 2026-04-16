import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Sidebar } from '../sidebar/sidebar';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-nuevo-producto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatSelectModule, MatFormFieldModule, Sidebar],
  templateUrl: './nuevo-producto.html',
  styleUrls: ['./nuevo-producto.css']
})
export class NuevoProducto implements OnInit {

  saving = false;
  user: any = null;
  isDragging = false; // Controla el estado visual del drag & drop

  // Modelo del producto
  producto = {
    name: '',
    description: '',
    short_description: '',
    price: null as number | null,
    unit: 'kg',
    stock_quantity: null as number | null,
    category_id: null as number | null,
  };

  unidades = ['kg', 'g', 'l', 'ml', 'ud', 'docena', 'manojo', 'caja', 'bandeja', 'saco', 'pack'];
  categorias: { id: number; name: string }[] = [];

  // Gestión de imágenes
  newImages: File[] = [];
  newImagePreviews: string[] = [];

  private apiUrl = environment.apiUrl;

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadCategorias();
  }

  loadCategorias(): void {
    this.http.get<any>(`${this.apiUrl}/categories`).subscribe({
      next: (res) => {
        this.categorias = res.data ?? res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando categorías', err)
    });
  }

  formularioValido(): boolean {
    return !!(
      this.producto.name &&
      this.producto.price && this.producto.price > 0 &&
      this.producto.category_id &&
      this.producto.description &&
      this.producto.stock_quantity !== null &&
      this.newImages.length >= 1
    );
  }

  /**
   * Captura archivos desde el input (click)
   */
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFiles(Array.from(input.files));
    }
    input.value = ''; // Reset para permitir subir la misma foto tras borrarla
  }

  /**
   * Captura archivos desde el evento Drop
   */
  onDrop(event: DragEvent): void {
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFiles(Array.from(files));
    }
  }

  /**
   * Lógica única para procesar y validar imágenes
   */
  private processFiles(files: File[]): void {
    // Validación: Máximo 6 imágenes en total
    if (this.newImages.length + files.length > 6) {
      alert('No puedes subir más de 6 imágenes por producto.');
      return;
    }

    files.forEach(file => {
      // Validación: Formato de imagen
      if (!file.type.startsWith('image/')) {
        alert(`El archivo "${file.name}" no es una imagen válida.`);
        return;
      }

      // Validación: Tamaño máximo 2MB
      if (file.size > 2 * 1024 * 1024) {
        alert(`La imagen "${file.name}" supera los 2MB permitidos.`);
        return;
      }

      this.newImages.push(file);

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.newImagePreviews.push(e.target.result);
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    });
  }

  onDragOver(event: DragEvent): void {
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    this.isDragging = false;
  }

  removeImage(index: number): void {
    this.newImages.splice(index, 1);
    this.newImagePreviews.splice(index, 1);
    this.cdr.detectChanges();
  }

  guardar(): void {
    if (!this.formularioValido()) return;

    this.saving = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    const formData = new FormData();
    formData.append('name', this.producto.name);
    formData.append('description', this.producto.description);
    formData.append('short_description', this.producto.short_description ?? '');
    formData.append('price', String(this.producto.price));
    formData.append('stock_quantity', String(this.producto.stock_quantity));
    formData.append('category_id', String(this.producto.category_id));
    formData.append('unit', this.producto.unit);

    this.newImages.forEach(img => {
      formData.append('images[]', img);
    });

    this.http.post(`${this.apiUrl}/products`, formData, { headers }).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/agricultor/mis-productos']);
      },
      error: (err) => {
        console.error('Error creando producto', err);
        alert('Hubo un error al guardar el producto.');
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }
}