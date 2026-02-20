import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-crear-producto',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule
  ],
  templateUrl: './crear-producto.html',
  styleUrls: ['./crear-producto.css']
})
export class CrearProducto implements OnInit {

  categorias: any[] = [];
  imagenes: File[]  = [];
  preview: string[] = [];
  isLoading         = false;
  error             = '';

  form = {
    category_id:        '',
    name:               '',
    short_description:  '',
    description:      '',
    price:            '',
    unit:             '',
    stock_quantity:   '',
    season_end:       ''
  };

  readonly unidades = [
    { value: 'kg',      label: 'Kilogramo (kg)' },
    { value: 'g',       label: 'Gramo (g)' },
    { value: 'l',       label: 'Litro (l)' },
    { value: 'ml',      label: 'Mililitro (ml)' },
    { value: 'ud',      label: 'Unidad (ud)' },
    { value: 'docena',  label: 'Docena' },
    { value: 'manojo',  label: 'Manojo' },
    { value: 'caja',    label: 'Caja' },
    { value: 'bandeja', label: 'Bandeja' },
    { value: 'saco',    label: 'Saco' },
    { value: 'pack',    label: 'Pack' },
  ];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.http.get<any[]>(`${environment.apiUrl}/categories`).subscribe({
      next: (data) => this.categorias = data,
      error: ()     => console.error('Error cargando categorías')
    });
  }

  onImagenesSeleccionadas(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    this.imagenes = Array.from(input.files).slice(0, 4); // máx 4 fotos
    this.preview  = [];

    this.imagenes.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => this.preview.push(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  }

  eliminarImagen(index: number): void {
    this.imagenes.splice(index, 1);
    this.preview.splice(index, 1);
  }

  guardar(): void {
    this.error = '';

    // Validación básica
    if (!this.form.category_id || !this.form.name || !this.form.description ||
        !this.form.price || !this.form.unit || !this.form.stock_quantity) {
      this.error = 'Rellena todos los campos obligatorios.';
      return;
    }

    this.isLoading = true;

    // ✅ multipart/form-data para poder subir imágenes
    const formData = new FormData();
    formData.append('category_id',    this.form.category_id);
    formData.append('name',           this.form.name);
    formData.append('description',    this.form.description);
    formData.append('price',          this.form.price);
    formData.append('unit',           this.form.unit);
    formData.append('stock_quantity', this.form.stock_quantity);

    if (this.form.season_end) {
      formData.append('season_end', this.form.season_end);
    }

    this.imagenes.forEach(img => formData.append('images[]', img));

    this.http.post(`${environment.apiUrl}/products`, formData).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/mis-productos']);
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Error al crear el producto.';
        console.error(err);
      }
    });
  }
}
