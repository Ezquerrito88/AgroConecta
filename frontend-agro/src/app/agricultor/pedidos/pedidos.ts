import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService, Order } from '../../core/services/order';
import { Sidebar } from '../sidebar/sidebar';
import { SmartDatePipe } from '../../core/pipes/smart-date-pipe';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, Sidebar, SmartDatePipe],
  templateUrl: './pedidos.html',
  styleUrls: ['./pedidos.css'],
})
export class Pedidos implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  loading = true;
  activeTab = 'all';
  selectedStatus = '';
  selectedPeriod = '30';
  openMenuId: number | null = null;

  get totalPedidos()    { return this.orders.length; }
  get pendingCount()    { return this.orders.filter(o => o.status === 'pending').length; }
  get processingCount() { return this.orders.filter(o => o.status === 'processing').length; }
  get deliveredCount()  { return this.orders.filter(o => o.status === 'delivered').length; }

  statusLabels: Record<string, string> = {
    pending:    'Pendiente',
    processing: 'Procesando',
    shipped:    'En camino',
    delivered:  'Entregado',
    cancelled:  'Cancelado',
  };

  statusClasses: Record<string, string> = {
    pending:    'status-pending',
    processing: 'status-processing',
    shipped:    'status-shipped',
    delivered:  'status-delivered',
    cancelled:  'status-cancelled',
  };

  statusIcons: Record<string, string> = {
    pending:    'schedule',
    processing: 'sync',
    shipped:    'local_shipping',
    delivered:  'check_circle',
    cancelled:  'cancel',
  };

  constructor(
    private orderService: OrderService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.orderService.getFarmerOrders().subscribe({
      next: (data) => {
        setTimeout(() => {
          this.orders = [...data];
          this.filteredOrders = [...data];
          this.loading = false;
          this.cdr.detectChanges();
        }, 0);
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.orders];
    if (this.activeTab !== 'all') result = result.filter(o => o.status === this.activeTab);
    if (this.selectedStatus)      result = result.filter(o => o.status === this.selectedStatus);
    this.filteredOrders = result;
  }

  updateStatus(orderId: number, status: string): void {
    this.orderService.updateOrderStatus(orderId, status).subscribe({
      next: (updated) => {
        const idx = this.orders.findIndex(o => o.id === orderId);
        if (idx !== -1) this.orders[idx].status = updated.status;
        this.applyFilters();
        this.openMenuId = null;
        this.cdr.detectChanges();
      }
    });
  }

  toggleMenu(id: number): void {
    this.openMenuId = this.openMenuId === id ? null : id;
  }
}
