import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';

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

  constructor(private cartService: CartService) {}

  ngOnInit() {
    // Nos suscribimos a los cambios
    this.cartService.items$.subscribe(items => {
      this.items = items;
      this.total = this.cartService.getTotalPrice();
    });

    this.cartService.isOpen$.subscribe(open => {
      this.isOpen = open;
    });
  }

  close() { this.cartService.closeCart(); }
  removeItem(id: number) { this.cartService.removeFromCart(id); }

  updateQuantity(id: number, change: number) {
    this.cartService.updateQuantity(id, change);
  }
}