import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  // 1. ESTADO DE LOS PRODUCTOS (Lista de la compra)
  // BehaviorSubject es como una "caja" que guarda el valor actual y avisa a todos cuando cambia.
  private itemsSource = new BehaviorSubject<any[]>(this.cargarDelStorage());
  items$ = this.itemsSource.asObservable(); // El signo $ indica que es un Observable (un flujo de datos)

  // 2. ESTADO VISUAL (¿Está abierto el cajón lateral?)
  private isOpenSource = new BehaviorSubject<boolean>(false);
  isOpen$ = this.isOpenSource.asObservable();

  constructor() { }

  // --- MÉTODOS DE LÓGICA ---

  /**
   * Añade un producto al carrito.
   * Si ya existe, suma 1 a la cantidad. Si no, lo añade nuevo.
   */
  addToCart(product: any) {
    const currentItems = this.itemsSource.value;
    const existingItem = currentItems.find(item => item.id === product.id);

    let newItems = [];

    if (existingItem) {
      // Si ya existe, creamos una copia de la lista actualizando la cantidad
      newItems = currentItems.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      );
    } else {
      // Si es nuevo, lo añadimos con cantidad 1
      newItems = [...currentItems, { ...product, quantity: 1 }];
    }

    // Actualizamos la "caja" y guardamos en memoria del navegador
    this.actualizarEstado(newItems);
    
    // Abrimos el carrito automáticamente para dar feedback al usuario
    this.openCart();
  }

  /**
   * Elimina un producto completamente de la lista
   */
  removeFromCart(productId: number) {
    const currentItems = this.itemsSource.value;
    const newItems = currentItems.filter(item => item.id !== productId);
    
    this.actualizarEstado(newItems);
  }

  /**
   * Suma o resta cantidad (+1 o -1)
   */
  updateQuantity(productId: number, change: number) {
    const currentItems = this.itemsSource.value;
    const newItems = currentItems.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + change;
        return { ...item, quantity: newQty > 0 ? newQty : 1 }; // Evitamos 0 o negativos
      }
      return item;
    });

    this.actualizarEstado(newItems);
  }

  /**
   * Calcula el precio total de todo el carrito
   */
  getTotalPrice(): number {
    return this.itemsSource.value.reduce((total, item) => {
      return total + (Number(item.price) * item.quantity);
    }, 0);
  }

  /**
   * Vacía el carrito
   */
  clearCart() {
    this.actualizarEstado([]);
  }

  // --- MÉTODOS DE VISIBILIDAD (Abrir/Cerrar Cajón) ---
  
  openCart() {
    this.isOpenSource.next(true);
  }

  closeCart() {
    this.isOpenSource.next(false);
  }

  // --- HELPERS PRIVADOS (LocalStorage) ---

  // Guarda en la variable y en el navegador a la vez
  private actualizarEstado(items: any[]) {
    this.itemsSource.next(items);
    localStorage.setItem('cart_items', JSON.stringify(items));
  }

  // Recupera datos al recargar la página
  private cargarDelStorage(): any[] {
    const saved = localStorage.getItem('cart_items');
    return saved ? JSON.parse(saved) : [];
  }
}