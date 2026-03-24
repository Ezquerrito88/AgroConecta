import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart-drawer.html',
  styleUrls: ['./cart-drawer.css']
})
export class CartDrawer implements OnInit {
  items: any[] = [];
  isOpen: boolean = false;
  total: number = 0;

  constructor(private cartService: CartService, private router: Router) { }

  ngOnInit(): void {
    this.cartService.items$.subscribe(items => {
      this.items = items;
      this.total = this.cartService.getTotalPrice();
    });

    this.cartService.isOpen$.subscribe(open => {
      this.isOpen = open;
    });
  }

  getImageUrl(item: any): string {
    // ✅ Usa image_url directo del backend si existe
    if (item?.image_url) return item.image_url;

    if (item?.image) {
      const imgStr = String(item.image);
      if (imgStr.startsWith('http')) return imgStr;
    }

    if (item?.images?.length > 0) {
      const firstImage = item.images[0];
      if (firstImage.image_url) return firstImage.image_url;
      const path = typeof firstImage === 'string' ? firstImage : firstImage.image_path;
      if (path?.startsWith('http')) return path;
    }

    return 'assets/placeholder.png';
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%239ca3af'%3ESin imagen%3C/text%3E%3C/svg%3E`;
    img.onerror = null;
  }

  close(): void { this.cartService.closeCart(); }
  removeItem(id: number): void { this.cartService.removeFromCart(id); }
  updateQuantity(id: number, change: number): void { this.cartService.updateQuantity(id, change); }

  goToCart(): void {
    this.cartService.closeCart();
    this.router.navigate(['/cesta']);
  }
}
