import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CarritoService, CartItem } from './carrito';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  get items$() {
    return this.carritoService.items$;
  }

  // 2. ESTADO VISUAL (¿Está abierto el cajón lateral?)
  private isOpenSource = new BehaviorSubject<boolean>(false);
  isOpen$ = this.isOpenSource.asObservable();

  constructor(private carritoService: CarritoService) { }

  // --- MÉTODOS DE LÓGICA ---

  /**
   * Añade un producto al carrito.
   * Si ya existe, suma 1 a la cantidad. Si no, lo añade nuevo.
   */
  addToCart(product: any) {
    this.carritoService.add(this.normalizeItem(product));
    
    // Abrimos el carrito automáticamente para dar feedback al usuario
    this.openCart();
  }

  /**
   * Elimina un producto completamente de la lista
   */
  removeFromCart(productId: number) {
    this.carritoService.remove(productId);
  }

  /**
   * Suma o resta cantidad (+1 o -1)
   */
  updateQuantity(productId: number, change: number) {
    const currentItems = this.carritoService.getItems();
    const item = currentItems.find(i => i.id === productId);

    if (!item) return;

    const newQty = item.quantity + change;
    this.carritoService.update({
      ...item,
      quantity: newQty > 0 ? newQty : 1
    });
  }

  /**
   * Calcula el precio total de todo el carrito
   */
  getTotalPrice(): number {
    return this.carritoService.getItems().reduce((total, item) => {
      return total + (Number(item.price) * item.quantity);
    }, 0);
  }

  /**
   * Vacía el carrito
   */
  clearCart() {
    this.carritoService.clear();
  }

  // --- MÉTODOS DE VISIBILIDAD (Abrir/Cerrar Cajón) ---
  
  openCart() {
    this.isOpenSource.next(true);
  }

  closeCart() {
    this.isOpenSource.next(false);
  }

  private normalizeItem(product: any): CartItem {
    const rawFarmer = product?.farmer;

    return {
      id: Number(product?.id),
      name: product?.name,
      farmer: typeof rawFarmer === 'string'
        ? rawFarmer
        : rawFarmer?.user?.name ?? rawFarmer?.full_name ?? rawFarmer?.name ?? 'Agricultor local',
      farmerId: Number(product?.farmerId ?? rawFarmer?.user_id ?? rawFarmer?.id ?? 0),
      price: Number(product?.price ?? 0),
      unit: product?.unit ?? 'ud',
      quantity: Number(product?.quantity ?? 1),
      image: product?.image
    };
  }
}