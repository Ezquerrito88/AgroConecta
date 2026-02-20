import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-detalle-producto',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './detalle-producto.html',
  styleUrls: ['./detalle-producto.css']
})
export class DetalleProducto implements OnInit, AfterViewInit {

  private readonly API_URL = environment.apiUrl;

  product: any = null;
  cantidad: number = 1;
  isLoading: boolean = true;
  activeTab: string = 'descripcion';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.cargarProducto(id);
      } else {
        this.isLoading = false;
      }
    });
  }

  ngAfterViewInit(): void {
    // Esperamos a que el DOM esté listo para calcular la posición inicial
    setTimeout(() => this.moveIndicator(), 0);
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    // Esperamos un tick para que Angular aplique [class.active] antes de medir
    setTimeout(() => this.moveIndicator(), 0);
  }

  private moveIndicator(): void {
    const activeBtn = document.querySelector<HTMLElement>('.tabs-header button.active');
    const indicator = document.querySelector<HTMLElement>('.tab-indicator');
    if (!activeBtn || !indicator) return;

    indicator.style.width = `${activeBtn.offsetWidth}px`;
    indicator.style.left  = `${activeBtn.offsetLeft}px`;
  }

  getImagenUrl(product: any): string {
    if (product?.images?.length > 0) {
      const path = product.images[0].image_path;
      if (path.startsWith('http')) {
        return path.replace(/http:\/\/127\.0\.0\.1:8000/g, this.API_URL);
      }
      return `${this.API_URL}/storage/${path}`;
    }
    return 'assets/placeholder.png';
  }

  cargarProducto(id: string): void {
    this.isLoading = true;

    this.http.get(`${this.API_URL}/api/products/${id}`).subscribe({
      next: (data: any) => {
        this.product = data;
        this.isLoading = false;
        this.cd.detectChanges();
        // Reposicionamos el indicador tras cargar el producto
        // por si el DOM tardó en renderizar las pestañas
        setTimeout(() => this.moveIndicator(), 0);
      },
      error: (err) => {
        console.error('❌ ERROR de carga:', err);
        this.isLoading = false;
      }
    });
  }

  cambiarCantidad(valor: number): void {
    const nuevaCantidad = this.cantidad + valor;
    const maxStock = this.product?.stock_quantity || 100;

    if (nuevaCantidad >= 1 && nuevaCantidad <= maxStock) {
      this.cantidad = nuevaCantidad;
    }
  }

  agregarAlCarrito(): void {
    if (!this.product) return;
    console.log(`🛒 Añadiendo ${this.cantidad} de ${this.product.name}`);
    alert(`Se han añadido ${this.cantidad} kgs de ${this.product.name} al carrito`);
  }
}
