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

  private readonly API_URL = environment.apiUrl;
  private readonly STORAGE_URL = environment.storageUrl;

  constructor(private cartService: CartService, private router: Router) {}

  ngOnInit() {
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
      return String(item.image).replace(/127\.0\.0\.1:8000/g, 'localhost:8000');
    }

    if (item?.images?.length > 0 && item.images[0]?.image_path) {
      const path = item.images[0].image_path;
      if (path.startsWith('http')) {
        return path.replace(/127\.0\.0\.1:8000/g, 'localhost:8000');
      }
      return `${this.STORAGE_URL}/${path}`;
    }

    if (item?.images?.length > 0 && typeof item.images[0] === 'string') {
      const path = item.images[0];
      if (path.startsWith('http')) {
        return path.replace(/127\.0\.0\.1:8000/g, 'localhost:8000');
      }
      return `${this.STORAGE_URL}/${path}`;
    }

    if (item.images && item.images.length > 0) {
      const path = item.images[0].image_path;
      if (path.startsWith('http')) return path;
      return `${this.STORAGE_URL}/${path}`;
    }
    return 'assets/placeholder.png';
  }

  close() { this.cartService.closeCart(); }
  removeItem(id: number) { this.cartService.removeFromCart(id); }
  updateQuantity(id: number, change: number) { this.cartService.updateQuantity(id, change); }

  goToCart(): void {
    this.cartService.closeCart();
    this.router.navigate(['/cesta']);
  }
}
