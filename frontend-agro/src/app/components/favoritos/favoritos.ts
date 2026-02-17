import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { ProductoService } from '../../services/producto.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-favoritos',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatFormFieldModule, 
    MatSelectModule, 
    MatProgressSpinnerModule
  ],
  templateUrl: './favoritos.html',
  styleUrls: ['./favoritos.css']
})
export class Favoritos implements OnInit {

  // Usamos la URL del entorno actual (Local o Azure)
  private readonly API_URL = environment.apiUrl;

  productos: any[] = [];
  isLoading: boolean = true;

  constructor(private productoService: ProductoService) {}

  ngOnInit() {
    this.cargarFavoritos();
  }

  getImagenUrl(prod: any): string {
    if (prod.images && prod.images.length > 0) {
      const path = prod.images[0].image_path;
      
      // Limpiamos cualquier URL absoluta previa para que coincida con el entorno actual
      if (path.startsWith('http')) {
        return path.replace(/http:\/\/127\.0\.0\.1:8000|https:\/\/agroconecta-backend-v2-.*\.azurewebsites\.net/g, this.API_URL);
      }
      
      return `${this.API_URL}/storage/${path}`;
    }
    return 'assets/placeholder.png';
  }

  cargarFavoritos() {
    this.isLoading = true;
    this.productoService.getFavoritos().subscribe({
      next: (data: any[]) => {
        this.productos = data;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error cargando favoritos', err);
        this.isLoading = false;
      }
    });
  }

  quitarFavorito(id: number) {
    this.productos = this.productos.filter(p => p.id !== id);
    this.productoService.toggleFavorite(id).subscribe({
      error: (err: any) => console.error('Error al borrar favorito', err)
    });
  }
}