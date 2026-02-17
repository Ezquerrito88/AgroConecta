import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment'; // <--- Importación clave

@Component({
  selector: 'app-detalle-producto',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './detalle-producto.html',
  styleUrls: ['./detalle-producto.css']
})
export class DetalleProducto implements OnInit {

  private readonly API_URL = environment.apiUrl;

  product: any = null;
  cantidad: number = 1;
  isLoading: boolean = true;
  activeTab: string = 'descripcion';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.cargarProducto(id);
      } else {
        this.isLoading = false;
      }
    });
  }

  getImagenUrl(product: any): string {
    if (product?.images?.length > 0) {
      const path = product.images[0].image_path;
      
      if (path.startsWith('http')) {
        return path.replace(/http:\/\/127\.0\.0\.1:8000|https:\/\/agroconecta-backend-v2-.*\.azurewebsites\.net/g, this.API_URL);
      }
      
      return `${this.API_URL}/storage/${path}`;
    }
    return 'assets/placeholder.png';
  }

  cargarProducto(id: string) {
    this.isLoading = true;
    // Construimos la ruta API dinámicamente
    this.http.get(`${this.API_URL}/api/products/${id}`).subscribe({
      next: (data: any) => {
        this.product = data;
        this.isLoading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('❌ ERROR de carga:', err);
        this.isLoading = false;
      }
    });
  }

  cambiarCantidad(valor: number) {
    const nuevaCantidad = this.cantidad + valor;
    const maxStock = this.product?.stock_quantity || 100;
    if (nuevaCantidad >= 1 && nuevaCantidad <= maxStock) {
      this.cantidad = nuevaCantidad;
    }
  }

  agregarAlCarrito() {
    if (!this.product) return;
    alert(`Se han añadido ${this.cantidad} kgs de ${this.product.name} al carrito`);
  }
}