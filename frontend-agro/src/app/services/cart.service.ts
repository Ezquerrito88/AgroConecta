import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  // 1. ESTADO DE LOS PRODUCTOS
  // Inicializamos vacío y cargamos en el constructor para evitar errores de SSR
  private itemsSource = new BehaviorSubject<any[]>([]);
  items$ = this.itemsSource.asObservable();

  // 2. ESTADO VISUAL
  private isOpenSource = new BehaviorSubject<boolean>(false);
  isOpen$ = this.isOpenSource.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Solo cargamos del storage si estamos en el navegador
    if (isPlatformBrowser(this.platformId)) {
      this.itemsSource.next(this.cargarDelStorage());
    }
  }

  // --- MÉTODOS DE LÓGICA ---

  addToCart(product: any) {
    const currentItems = this.itemsSource.value;
    // Aseguramos que el ID sea comparado correctamente
    const existingItem = currentItems.find(item => item.id === product.id);

    let newItems = [];

    if (existingItem) {
      newItems = currentItems.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      );
    } else {
      // Importante: Nos aseguramos de que el precio sea un número desde que entra
      newItems = [...currentItems, { ...product, quantity: 1, price: Number(product.price) }];
    }

    this.actualizarEstado(newItems);
    this.openCart();
  }

  removeFromCart(productId: number) {
    const newItems = this.itemsSource.value.filter(item => item.id !== productId);
    this.actualizarEstado(newItems);
  }

  updateQuantity(productId: number, change: number) {
    const newItems = this.itemsSource.value.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + change;
        return { ...item, quantity: newQty > 0 ? newQty : 1 };
      }
      return item;
    });
    this.actualizarEstado(newItems);
  }

  getTotalPrice(): number {
    return this.itemsSource.value.reduce((total, item) => {
      return total + (Number(item.price) * item.quantity);
    }, 0);
  }

  clearCart() {
    this.actualizarEstado([]);
  }

  // --- MÉTODOS DE VISIBILIDAD ---
  
  openCart() { this.isOpenSource.next(true); }
  closeCart() { this.isOpenSource.next(false); }

  // --- HELPERS PRIVADOS ---

  private actualizarEstado(items: any[]) {
    this.itemsSource.next(items);
    // Solo guardamos si estamos en el navegador
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('cart_items', JSON.stringify(items));
    }
  }

  private cargarDelStorage(): any[] {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('cart_items');
      try {
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        console.error("Error al parsear el carrito", e);
        return [];
      }
    }
    return [];
  }
}