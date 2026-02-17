import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';


import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';


import { ProductoService } from '../../services/producto.service';

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

  // URL de tu Backend en Azure
  readonly API_URL = 'https://agroconecta-backend-v2-bxbxfudaatbmgxdg.spaincentral-01.azurewebsites.net';

  productos: any[] = [];
  isLoading: boolean = true;

  constructor(private productoService: ProductoService) {}

  ngOnInit() {
    this.cargarFavoritos();
  }

  // Función para limpiar la URL de la imagen y que no use localhost
  getImagenUrl(prod: any): string {
    if (prod.images && prod.images.length > 0) {
      const path = prod.images[0].image_path;
      
      // Si el path ya viene con localhost de la DB, lo corregimos
      if (path.startsWith('http')) {
        return path.replace(/http:\/\/127\.0\.0\.1:8000/g, this.API_URL);
      }
      
      return `${this.API_URL}/storage/${path}`;
    }
    return '';
  }

  cargarFavoritos() {
    this.isLoading = true;
    
    this.productoService.getFavoritos().subscribe({
      next: (data: any[]) => {
        this.productos = data;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error cargando favoritos desde Azure', err);
        this.isLoading = false;
      }
    });
  }

  quitarFavorito(id: number) {
    this.productos = this.productos.filter(p => p.id !== id);

    this.productoService.toggleFavorite(id).subscribe({
      error: (err: any) => {
        console.error('Error al borrar favorito', err);
      }
    });
  }
}