import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { environment } from '../../../environments/environment';
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

  private readonly API_URL    = environment.apiUrl;
  private readonly STORAGE_URL = environment.storageUrl;

  constructor(private cartService: CartService, private router: Router) {}

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
    if (item?.image) {
      const imgStr = String(item.image);
      if (imgStr.includes('localhost:8000') || imgStr.includes('127.0.0.1:8000')) {
        return imgStr.replace(
          /http:\/\/(127\.0\.0\.1|localhost):8000\/storage/g,
          this.STORAGE_URL
        );
      }
      return imgStr;
    }

    if (item?.images?.length > 0) {
      const firstImage = item.images[0];
      const path = typeof firstImage === 'string' ? firstImage : firstImage.image_path;
      if (path) {
        if (path.startsWith('http')) {
          return path.replace(
            /http:\/\/(127\.0\.0\.1|localhost):8000\/storage/g,
            this.STORAGE_URL
          );
        }
        return `${this.STORAGE_URL}/${path}`;
      }
    }

    return 'assets/placeholder.png';
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/placeholder.png';
  }

  close(): void                             { this.cartService.closeCart(); }
  removeItem(id: number): void              { this.cartService.removeFromCart(id); }
  updateQuantity(id: number, change: number): void { this.cartService.updateQuantity(id, change); }

  goToCart(): void {
    this.cartService.closeCart();
    this.router.navigate(['/cesta']);
  }
}
