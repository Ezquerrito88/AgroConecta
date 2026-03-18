import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-nuevo-producto',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatSelectModule, MatFormFieldModule, Sidebar],
  templateUrl: './nuevo-producto.html',
  styleUrls: ['./nuevo-producto.css']
})
export class NuevoProducto implements OnInit {

  saving = false;

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

  newImages: File[] = [];
  newImagePreviews: string[] = [];

  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadCategorias();
  }

  loadCategorias(): void {
    this.http.get<any>(`${this.apiUrl}/categories`).subscribe({
      next: (res) => this.categorias = res.data ?? res,
      error: (err) => console.error('Error cargando categorías', err)
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    Array.from(input.files).forEach(file => {
      this.newImages.push(file);
      const reader = new FileReader();
      reader.onload = (e) => this.newImagePreviews.push(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number): void {
    this.newImages.splice(index, 1);
    this.newImagePreviews.splice(index, 1);
  }

  guardar(): void {
    if (!this.producto.name || !this.producto.price || !this.producto.category_id) return;

    this.saving = true;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    const formData = new FormData();
    formData.append('name', this.producto.name);
    formData.append('description', this.producto.description ?? '');
    formData.append('short_description', this.producto.short_description ?? '');
    formData.append('price', String(this.producto.price));
    formData.append('stock_quantity', String(this.producto.stock_quantity ?? 0));
    formData.append('category_id', String(this.producto.category_id));
    if (this.producto.unit) formData.append('unit', this.producto.unit);
    this.newImages.forEach(img => formData.append('images[]', img));

    this.http.post(`${this.apiUrl}/products`, formData, { headers }).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/agricultor/mis-productos']);
      },
      error: (err) => {
        console.error('Error creando producto', err);
        this.saving = false;
      }
    });
  }
}
