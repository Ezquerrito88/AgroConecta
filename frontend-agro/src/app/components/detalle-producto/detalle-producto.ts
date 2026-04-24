import { Component, OnInit, AfterViewInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { CartService } from '../../core/services/cart.service';
import { ProductoService } from '../../core/services/producto.service'; // ajusta el path si es necesario

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
  isFarmer: boolean = false;

  lightboxOpen: boolean = false;
  lightboxIndex: number = 0;

  isFavorite: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cd: ChangeDetectorRef,
    private cartService: CartService,
    private productoService: ProductoService
  ) { }

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user') ?? 'null');
    const role = user?.role?.toLowerCase();
    this.isFarmer = role === 'agricultor' || role === 'farmer';

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) this.cargarProducto(id);
      else this.isLoading = false;
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.moveIndicator(), 0);
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.lightboxOpen) return;
    if (event.key === 'Escape') {
      this.closeLightbox();
    } else if (event.key === 'ArrowLeft') {
      this.lightboxIndex = (this.lightboxIndex - 1 + this.product.images.length) % this.product.images.length;
    } else if (event.key === 'ArrowRight') {
      this.lightboxIndex = (this.lightboxIndex + 1) % this.product.images.length;
    }
  }

  // ===== FAVORITOS =====
  private loadFavoriteState(): void {
    this.isFavorite = !!this.product?.is_favorite;
  }

  toggleFavorite(event: Event): void {
    event.stopPropagation();
    if (!localStorage.getItem('token')) {
      this.router.navigate(['/login']);
      return;
    }
    if (!this.product) return;

    this.isFavorite = !this.isFavorite;
    this.product.is_favorite = this.isFavorite;

    this.productoService.toggleFavorite(this.product.id).subscribe({
      error: () => {
        this.isFavorite = !this.isFavorite;
        this.product.is_favorite = this.isFavorite;
      }
    });
  }

  // ===== RATING =====
  get ratingAverage(): number {
    if (!this.product?.reviews?.length) return 0;
    const sum = this.product.reviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0);
    return Math.round((sum / this.product.reviews.length) * 10) / 10;
  }

  get ratingCount(): number {
    return this.product?.reviews?.length || 0;
  }

  get starTypes(): string[] {
    const avg = this.ratingAverage;
    return [1, 2, 3, 4, 5].map(i => {
      if (avg >= i) return 'full';
      if (avg >= i - 0.5) return 'half';
      return 'empty';
    });
  }

  // ===== TABS =====
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

  // ===== LIGHTBOX =====
  openLightbox(index: number): void {
    this.lightboxIndex = index;
    this.lightboxOpen = true;
    this.selectedImageIndex = index;
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
    document.body.style.overflow = '';
  }

  // ===== IMÁGENES =====
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

  // ===== PRODUCTO =====
  cargarProducto(id: string): void {
    this.isLoading = true;
    this.http.get(`${this.API_URL}/products/${id}`).subscribe({
      next: (data: any) => {
        this.product = data;
        this.isLoading = false;
        this.loadFavoriteState();
        this.cd.detectChanges();
        setTimeout(() => this.moveIndicator(), 0);
      },
      error: (err) => {
        console.error('❌ Error al cargar producto:', err);
        this.isLoading = false;
      }
    });
  }

  // ===== CANTIDAD =====
  cambiarCantidad(valor: number): void {
    const nueva = this.cantidad + valor;
    const max = this.product?.stock_quantity || 100;
    if (nueva >= 1 && nueva <= max) {
      this.cantidad = nueva;
    }
  }

  validarCantidad(): void {
    const max = this.product?.stock_quantity || 100;
    if (!this.cantidad || this.cantidad < 1) this.cantidad = 1;
    if (this.cantidad > max) this.cantidad = max;
    this.cantidad = Math.floor(this.cantidad);
  }

  // ===== CONTACTAR =====
  contactarFarmer(): void {
    const farmerId = this.product?.farmer?.user_id ?? this.product?.farmer?.id;
    if (!farmerId) return;
    this.router.navigate(['/comprador/mensajes'], {
      queryParams: {
        farmerId,
        productId: this.product.id,
        productName: this.product.name,
        productImage: this.getImagenUrlByIndex(0),
        productPrice: this.product.price,
        productUnit: this.product.unit
      }
    });
  }

  // ===== CARRITO =====
  agregarAlCarrito(): void {
    if (!this.product || this.isFarmer) return;
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