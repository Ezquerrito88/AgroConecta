import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { environment } from '../../../environments/environment';

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

  constructor(private cartService: CartService) {}

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
}
