import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Definimos la interfaz para que sea más fácil trabajar con los datos
interface Producto {
  id: number;
  nombre: string;
  imagen: string;
  precio: number;
  unidad: string;
  valoracion: number;
  esFavorito: boolean;
  vendedor: {
    nombre: string;
    avatar: string;
    ubicacion: string;
  };
}

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css'
})
export class Catalogo {
  
  // Estado de los filtros
  filtros = {
    categoria: 'todas',
    precioMax: 50,
    ubicacion: 'todas',
    valoracion: 'todas',
    orden: 'novedad'
  };

  // DATOS DE PRUEBA (Para que se vea como en la imagen)
  // En el futuro, esto vendrá de tu ProductoService
  productos: Producto[] = Array(12).fill(null).map((_, index) => ({
    id: index + 1,
    nombre: 'Lechuga Fresca',
    // Usamos una imagen de placeholder, reemplázala por la ruta real cuando tengas backend
    imagen: 'https://via.placeholder.com/150?text=Lechuga', 
    precio: 12.99,
    unidad: 'kg',
    valoracion: 4.9,
    esFavorito: false,
    vendedor: {
      nombre: 'José Javier',
      avatar: 'https://i.pravatar.cc/150?u=josejavier', // Avatar de ejemplo
      ubicacion: 'Logroño'
    }
  }));

  constructor() {}

  // Método para limpiar los filtros
  limpiarFiltros() {
    this.filtros = {
      categoria: 'todas',
      precioMax: 50,
      ubicacion: 'todas',
      valoracion: 'todas',
      orden: 'novedad'
    };
  }

  // Método para marcar/desmarcar favorito
  toggleFavorito(prod: Producto) {
    prod.esFavorito = !prod.esFavorito;
  }
}