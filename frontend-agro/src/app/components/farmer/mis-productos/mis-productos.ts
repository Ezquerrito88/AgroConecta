import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductoService } from '../../../services/producto.service'; // Ajusta la ruta a tu servicio
import { Producto } from '../../../models/producto'; // Ajusta la ruta a tu modelo

@Component({
  selector: 'app-mis-productos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mis-productos.html',
  styleUrls: ['./mis-productos.css'] // o .scss
})
export class MisProductos implements OnInit {
  products: Producto[] = [];
  isLoading: boolean = true;

  // Inyectamos tu ProductoService
  constructor(private productoService: ProductoService) {}

  ngOnInit(): void {
    this.cargarMisProductos();
  }

  cargarMisProductos(): void {
    // Llamamos al nuevo método del servicio
    this.productoService.getMisProductos().subscribe({
      next: (data) => {
        this.products = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar mis productos:', error);
        this.isLoading = false;
        alert('Hubo un error al cargar tu catálogo.');
      }
    });
  }

  deleteProduct(id: number): void {
    if(confirm('¿Estás seguro de que deseas eliminar este producto de tu catálogo?')) {
      // 1. Borrado optimista de la interfaz
      this.products = this.products.filter(p => p.id !== id);
      
      // 2. Petición real al backend
      this.productoService.deleteProducto(id).subscribe({
        next: () => console.log(`Producto ${id} eliminado correctamente.`),
        error: (err) => {
          console.error('Error al eliminar:', err);
          alert('No se pudo eliminar el producto en el servidor.');
          this.cargarMisProductos(); // Recargamos si falla para restaurar la vista
        }
      });
    }
  }
}