import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService, Order } from '../../core/services/order';
import { AuthService } from '../../core/services/auth';
import { Sidebar } from '../sidebar/sidebar';
import { SmartDatePipe } from '../../core/pipes/smart-date-pipe';

// Definimos el tipo exacto para evitar el error TS2322
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyPipe, FormsModule, Sidebar, SmartDatePipe],
  templateUrl: './pedidos.html',
  styleUrls: ['./pedidos.css']
})
export class Pedidos implements OnInit {
  user: any = null;
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  loading = true;
  activeTab = 'all';
  selectedStatus = '';
  openMenuId: number | null = null;
  today = new Date();

  statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    processing: 'En proceso',
    shipped: 'En camino',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  };

  statusIcons: Record<string, string> = {
    pending: 'schedule',
    processing: 'sync',
    shipped: 'local_shipping',
    delivered: 'check_circle',
    cancelled: 'cancel',
  };

  statusClasses: Record<string, string> = {
    pending: 'status-pending',
    processing: 'status-processing',
    shipped: 'status-shipped',
    delivered: 'status-delivered',
    cancelled: 'status-cancelled',
  };

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.orderService.getFarmerOrders().subscribe({
      next: (data) => {
        this.orders = data;
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // KPIs dinámicos
  get totalPedidos() { return this.orders.length; }
  get pendingCount() { return this.orders.filter(o => o.status === 'pending').length; }
  get processingCount() { return this.orders.filter(o => o.status === 'processing').length; }
  get deliveredCount() { return this.orders.filter(o => o.status === 'delivered').length; }
  get totalGanancias() { 
    return this.orders
      .filter(o => o.status !== 'cancelled')
      .reduce((suma, order) => suma + (Number(order.total) || 0), 0); 
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.orders];
    if (this.activeTab !== 'all') {
      result = result.filter(o => o.status === this.activeTab);
    }
    if (this.selectedStatus) {
      result = result.filter(o => o.status === this.selectedStatus);
    }
    this.filteredOrders = result;
  }

  onSearch(event: any): void {
    const term = event.target.value.toLowerCase();
    this.filteredOrders = this.orders.filter(o => 
      o.buyer.name.toLowerCase().includes(term) || 
      o.id.toString().includes(term)
    );
  }

  // CORRECCIÓN DEL ERROR TS2322
  updateStatus(orderId: number, status: string): void {
    this.orderService.updateOrderStatus(orderId, status).subscribe({
      next: (updated) => {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
          // Usamos 'as OrderStatus' para decirle a TS que el string es seguro
          order.status = updated.status as OrderStatus;
        }
        this.applyFilters();
        this.openMenuId = null;
        this.cdr.detectChanges();
      }
    });
  }

  toggleMenu(id: number): void {
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  getAvatarColor(name: string): string {
    const colors = ['#dcfce7', '#dbeafe', '#fef9c3', '#f3e8ff', '#ffedd5'];
    const index = (name?.length || 0) % colors.length;
    return colors[index];
  }
}