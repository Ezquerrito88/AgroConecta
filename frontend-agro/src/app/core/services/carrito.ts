import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  id: number;
  name: string;
  farmer: string;
  farmerId: number;
  price: number;
  unit: string;
  quantity: number;
  image?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private readonly STORAGE_KEY = 'cart_items';

  private itemsSubject = new BehaviorSubject<CartItem[]>(this.loadFromStorage());
  items$ = this.itemsSubject.asObservable();

  constructor() {}

  private get snapshot(): CartItem[] {
    return this.itemsSubject.getValue();
  }

  getItems(): CartItem[] {
    return this.snapshot;
  }

  add(item: CartItem): void {
    const items = this.snapshot;
    const existente = items.find(i => i.id === item.id);
    if (existente) {
      existente.quantity += item.quantity;
      this.setItems([...items]);
    } else {
      this.setItems([...items, { ...item }]);
    }
  }

  update(item: CartItem): void {
    const items = this.snapshot.map(i =>
      i.id === item.id ? { ...item } : i
    );
    this.setItems(items);
  }

  remove(id: number): void {
    this.setItems(this.snapshot.filter(i => i.id !== id));
  }

  clear(): void {
    this.setItems([]);
  }


  get totalItems(): number {
    return this.snapshot.reduce((acc, i) => acc + i.quantity, 0);
  }

  get subtotal(): number {
    return this.snapshot.reduce((acc, i) => acc + i.price * i.quantity, 0);
  }

  private setItems(items: CartItem[]): void {
    this.itemsSubject.next(items);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
  }

  private loadFromStorage(): CartItem[] {
    const raw = localStorage.getItem(this.STORAGE_KEY) ?? localStorage.getItem('carrito_items');

    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map((item: any) => ({
        id: Number(item.id),
        name: item.name,
        farmer: item.farmer ?? item?.farmer?.full_name ?? item?.farmer?.name ?? 'Agricultor local',
        farmerId: Number(item.farmerId ?? item?.farmer?.user_id ?? item?.farmer?.id ?? 0),
        price: Number(item.price),
        unit: item.unit ?? 'ud',
        quantity: Number(item.quantity ?? 1),
        image: item.image
      }));
    } catch {
      return [];
    }
  }
}
