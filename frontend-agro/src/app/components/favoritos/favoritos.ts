import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Módulos de Material
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

// Tu servicio
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

  productos: any[] = [];
  isLoading: boolean = true;

  constructor(private productoService: ProductoService) {}

  ngOnInit() {
    this.cargarFavoritos();
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
      error: (err: any) => console.error('Error al borrar', err)
    });
  }
}