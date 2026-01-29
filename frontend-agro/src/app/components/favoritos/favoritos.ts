import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
// Imports de Material (si usas los filtros visuales)
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-favoritos',
  standalone: true,
  imports: [CommonModule, RouterModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './favoritos.html',
  styleUrls: ['./favoritos.css']
})
export class Favoritos implements OnInit {
  productos: any[] = [];
  isLoading: boolean = true;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarFavoritos();
  }

  cargarFavoritos() {
    this.isLoading = true;
    // Llamamos al endpoint que crearemos ahora en Laravel
    this.http.get<any[]>('http://127.0.0.1:8000/api/favorites').subscribe({
      next: (data) => {
        this.productos = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando favoritos', err);
        this.isLoading = false;
      }
    });
  }

  quitarFavorito(id: number) {
    // 1. Lo quitamos visualmente de la lista al instante
    this.productos = this.productos.filter(p => p.id !== id);

    // 2. Llamamos a la API para borrarlo de verdad
    this.http.post(`http://127.0.0.1:8000/api/favorites/${id}`, {}).subscribe();
  }
}