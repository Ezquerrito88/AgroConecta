import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { C } from '@angular/cdk/keycodes';

@Component({
  selector: 'app-detalle-producto',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './detalle-producto.html',
  styleUrls: ['./detalle-producto.css']
})
export class DetalleProducto implements OnInit {

  product: any = null;
  cantidad: number = 1;
  isLoading: boolean = true;

  // 👇 ESTA ES LA VARIABLE QUE FALTABA 👇
  activeTab: string = 'descripcion';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      console.log('➡️ PASO 1: ID detectado en URL:', id);

      if (id) {
        this.cargarProducto(id);
      } else {
        console.error('❌ Error: No se encontró ID en la URL');
        this.isLoading = false;
      }
    });
  }

  cargarProducto(id: string) {
    this.isLoading = true;

    this.http.get(`http://127.0.0.1:8000/api/products/${id}`).subscribe({
      next: (data: any) => {
        console.log('✅ PASO 2: Datos recibidos:', data);
        this.product = data;
        this.isLoading = false;
        this.cd.detectChanges(); // <--- FUERZA LA ACTUALIZACIÓN DE PANTALLA
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
    console.log(`🛒 Añadiendo ${this.cantidad} de ${this.product.name}`);
    alert(`Se han añadido ${this.cantidad} kgs de ${this.product.name} al carrito`);
  }
}