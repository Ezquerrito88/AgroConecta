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

  // URL de tu Backend en Azure
  API_URL = environment.apiUrl;

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

  // Función para resolver la URL de la imagen correctamente
  getImageUrl(item: any): string {
    if (item.images && item.images.length > 0) {
      const path = item.images[0].image_path;
      
      // Si la ruta ya es una URL completa (y apunta a localhost), la corregimos
      if (path.startsWith('http')) {
        return path.replace(/http:\/\/127\.0\.0\.1:8000/g, this.API_URL);
      }
      
      // Si es una ruta relativa, le pegamos el prefijo de Azure
      return `${this.API_URL}/storage/${path}`;
    }
    return 'assets/placeholder.png';
  }

  close() { this.cartService.closeCart(); }
  removeItem(id: number) { this.cartService.removeFromCart(id); }

  updateQuantity(id: number, change: number) {
    this.cartService.updateQuantity(id, change);
  }
}