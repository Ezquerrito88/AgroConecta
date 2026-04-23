import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { SidebarComprador } from '../sidebar-comprador/sidebar-comprador';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-favoritos',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyPipe, FormsModule, SidebarComprador],
  templateUrl: './favoritos.html',
  styleUrl: './favoritos.css'
})
export class Favoritos implements OnInit {
  sidebarOpen = false;
  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }

  user: any = {};
  products:         any[] = [];
  filteredProducts: any[] = [];
  removingIds:      Set<number> = new Set();
  loading           = true;
  searchQuery       = '';
  sortBy            = 'default';

  skeletons = [1, 2, 3, 4, 5, 6];

  sortOptions = [
    { value: 'default',    label: 'Más recientes' },
    { value: 'name_asc',   label: 'Nombre A–Z' },
    { value: 'price_asc',  label: 'Precio: menor a mayor' },
    { value: 'price_desc', label: 'Precio: mayor a menor' },
  ];

  get firstName(): string { return this.user?.name?.split(' ')[0] ?? ''; }
  get userInitial(): string { return this.firstName.charAt(0).toUpperCase(); }

  get uniqueFarmers(): number {
  const names = this.products.map(p => p.farmer?.user?.name ?? p.farmer?.farm_name).filter(Boolean);
  return new Set(names).size;
}

  get avgPrice(): number {
    if (!this.products.length) return 0;
    return this.products.reduce((acc, p) => acc + Number(p.price), 0) / this.products.length;
  }

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');

    this.http.get<any[]>(`${environment.apiUrl}/favorites`).subscribe({
      next: (data) => {
        this.products = data;
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('ERROR:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    let result = [...this.products];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(p => p.name?.toLowerCase().includes(q));
    }

    switch (this.sortBy) {
      case 'name_asc':   result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'price_asc':  result.sort((a, b) => a.price - b.price);            break;
      case 'price_desc': result.sort((a, b) => b.price - a.price);            break;
    }

    this.filteredProducts = result;
    this.cdr.detectChanges();
  }

  toggleFavorito(product: any): void {
    this.removingIds.add(product.id);
    this.cdr.detectChanges();

    setTimeout(() => {
      this.http.post(`${environment.apiUrl}/favorites/${product.id}`, {}).subscribe({
        next: () => {
          this.products = this.products.filter(p => p.id !== product.id);
          this.removingIds.delete(product.id);
          this.applyFilters();
        }
      });
    }, 280);
  }

  getImagen(product: any): string {
    return product?.images?.[0]?.image_url ?? 'img/logo/logo.png';
  }
}