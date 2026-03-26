import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Sidebar } from '../sidebar/sidebar';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-nuevo-producto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatSelectModule, MatFormFieldModule, Sidebar],
  templateUrl: './nuevo-producto.html',
  styleUrls: ['./nuevo-producto.css']
})
export class NuevoProducto implements OnInit {

  saving = false;

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
    private http: HttpClient, 
    private router: Router,
    private cdr: ChangeDetectorRef // Inyectado para forzar la actualización de la vista
  ) {}

  ngOnInit(): void {
    this.loadCategorias();
  }

  /**
   * Carga las categorías desde la API
   */
  loadCategorias(): void {
    this.http.get<any>(`${this.apiUrl}/categories`).subscribe({
      next: (res) => {
        this.categorias = res.data ?? res;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando categorías', err)
    });
  }

  /**
   * Valida si el formulario está listo para ser enviado.
   * El botón de "Publicar" dependerá de esta función.
   */
  formularioValido(): boolean {
    return !!(
      this.producto.name && 
      this.producto.price && this.producto.price > 0 &&
      this.producto.category_id && 
      this.producto.description &&
      this.producto.stock_quantity !== null &&
      this.newImages.length >= 1 // Mínimo 1 imagen obligatoria
    );
  }

  /**
   * Gestiona la selección de imágenes y genera las previsualizaciones.
   */
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);

    // Validación: Máximo 6 imágenes en total
    if (this.newImages.length + files.length > 6) {
      alert('No puedes subir más de 6 imágenes por producto.');
      return;
    }

    files.forEach(file => {
      // Validación: Tamaño máximo 2MB
      if (file.size > 2 * 1024 * 1024) {
        alert(`La imagen "${file.name}" supera los 2MB permitidos.`);
        return;
      }

      this.newImages.push(file);

      // Generar preview asíncrona
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.newImagePreviews.push(e.target.result);
        
        // FORZAR ACTUALIZACIÓN: Esto hace que el botón se encienda 
        // y las fotos aparezcan al instante sin necesidad de hacer clic fuera.
        this.cdr.detectChanges(); 
      };
      reader.readAsDataURL(file);
    });

    // Limpiar el input para permitir volver a seleccionar el mismo archivo si se borra
    input.value = '';
    this.cdr.detectChanges();
  }

  /**
   * Elimina una imagen seleccionada antes de subirla.
   */
  removeImage(index: number): void {
    this.newImages.splice(index, 1);
    this.newImagePreviews.splice(index, 1);
    this.cdr.detectChanges(); // Actualizar vista tras borrar
  }

  /**
   * Envía los datos al servidor Laravel.
   */
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
    
    // Adjuntar imágenes al array que espera Laravel
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
        alert('Hubo un error al guardar el producto. Revisa los datos.');
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }
}