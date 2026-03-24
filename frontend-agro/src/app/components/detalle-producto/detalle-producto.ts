import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { CartService } from '../../core/services/cart.service';

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
  selectedImageIndex: number = 0;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cd: ChangeDetectorRef,
    private cartService: CartService
  ) { }

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
    setTimeout(() => this.moveIndicator(), 0);
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    setTimeout(() => this.moveIndicator(), 0);
  }

  private moveIndicator(): void {
    const activeBtn = document.querySelector<HTMLElement>('.tabs-header button.active');
    const indicator = document.querySelector<HTMLElement>('.tab-indicator');
    if (!activeBtn || !indicator) return;
    indicator.style.width = `${activeBtn.offsetWidth}px`;
    indicator.style.left = `${activeBtn.offsetLeft}px`;
  }

  // ✅ Usa image_url del backend (Azure), fallback a image_path
  getImagenUrl(product: any): string {
    if (product?.images?.length > 0) {
      const img = product.images[this.selectedImageIndex] ?? product.images[0];
      if (img.image_url) return img.image_url;
      const path = img.image_path;
      if (path?.startsWith('http')) return path;
      return `${environment.storageUrl}/${path}`;
    }
    return 'assets/placeholder.png';
  }

  // ✅ Usa image_url del backend (Azure), fallback a image_path
  getImagenUrlByIndex(index: number): string {
    if (this.product?.images?.length > index) {
      const img = this.product.images[index];
      if (img.image_url) return img.image_url;
      const path = img.image_path;
      if (path?.startsWith('http')) return path;
      return `${environment.storageUrl}/${path}`;
    }
    return 'assets/placeholder.png';
  }

  cargarProducto(id: string): void {
    this.isLoading = true;
    this.http.get(`${this.API_URL}/products/${id}`).subscribe({
      next: (data: any) => {
        this.product = data;
        this.isLoading = false;
        this.cd.detectChanges();
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

    const rawFarmerUserId = this.product?.farmer?.user_id;
    const rawFarmerId = this.product?.farmer?.id;
    const farmerId = Number(rawFarmerUserId ?? rawFarmerId);

    if (!Number.isFinite(farmerId) || farmerId <= 0) {
      console.error('No se pudo determinar el agricultor del producto', this.product);
      return;
    }

    this.cartService.addToCart({
      id: this.product.id,
      name: this.product.name,
      farmer: this.product?.farmer?.user?.name || 'Agricultor local',
      farmerId,
      price: Number(this.product.price),
      unit: this.product.unit,
      quantity: this.cantidad,
      image: this.getImagenUrl(this.product)
    });
  }
}
