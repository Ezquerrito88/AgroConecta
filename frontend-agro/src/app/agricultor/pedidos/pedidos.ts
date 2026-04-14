import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService, Order } from '../../core/services/order';
import { AuthService } from '../../core/services/auth';
import { Sidebar } from '../sidebar/sidebar';
import { SmartDatePipe } from '../../core/pipes/smart-date-pipe';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  displayedOrders: Order[] = [];
  loading = true;
  exporting = false;
  activeTab = 'all';
  selectedStatus = '';
  openMenuId: number | null = null;
  today = new Date();

  pageSize = 10;
  currentPage = 1;

  statusLabels: Record<string, string> = {
    pending:    'Pendiente',
    processing: 'En proceso',
    shipped:    'En camino',
    delivered:  'Entregado',
    cancelled:  'Cancelado',
  };

  statusIcons: Record<string, string> = {
    pending:    'schedule',
    processing: 'sync',
    shipped:    'local_shipping',
    delivered:  'check_circle',
    cancelled:  'cancel',
  };

  statusClasses: Record<string, string> = {
    pending:    'status-pending',
    processing: 'status-processing',
    shipped:    'status-shipped',
    delivered:  'status-delivered',
    cancelled:  'status-cancelled',
  };

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

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

  get totalPedidos()    { return this.orders.length; }
  get pendingCount()    { return this.orders.filter(o => o.status === 'pending').length; }
  get processingCount() { return this.orders.filter(o => o.status === 'processing').length; }
  get deliveredCount()  { return this.orders.filter(o => o.status === 'delivered').length; }
  get totalGanancias()  {
    return this.orders
      .filter(o => o.status !== 'cancelled')
      .reduce((suma, order) => suma + (Number(order.total) || 0), 0);
  }

  get hasMoreOrders(): boolean { return this.displayedOrders.length < this.filteredOrders.length; }
  get remainingCount(): number { return this.filteredOrders.length - this.displayedOrders.length; }

  setTab(tab: string): void {
    this.activeTab = tab;
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.orders];
    if (this.activeTab !== 'all') result = result.filter(o => o.status === this.activeTab);
    if (this.selectedStatus)      result = result.filter(o => o.status === this.selectedStatus);
    this.filteredOrders = result;
    this.currentPage = 1;
    this.displayedOrders = this.filteredOrders.slice(0, this.pageSize);
  }

  onSearch(event: any): void {
    const term = event.target.value.toLowerCase();
    this.filteredOrders = this.orders.filter(o =>
      o.buyer.name.toLowerCase().includes(term) ||
      o.id.toString().includes(term)
    );
    this.currentPage = 1;
    this.displayedOrders = this.filteredOrders.slice(0, this.pageSize);
  }

  loadMore(): void {
    this.currentPage++;
    this.displayedOrders = this.filteredOrders.slice(0, this.currentPage * this.pageSize);
    this.cdr.detectChanges();
  }

  updateStatus(orderId: number, status: string): void {
    this.orderService.updateOrderStatus(orderId, status).subscribe({
      next: (updated) => {
        const order = this.orders.find(o => o.id === orderId);
        if (order) order.status = updated.status as OrderStatus;
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
    return colors[(name?.length || 0) % colors.length];
  }

  // ── Exportar PDF ──────────────────────────────────
  async exportPDF(): Promise<void> {
    if (this.exporting) return;
    this.exporting = true;
    this.cdr.detectChanges();

    try {
      const pdf     = new jsPDF('p', 'mm', 'a4');
      const pageW   = pdf.internal.pageSize.getWidth();
      const pageH   = pdf.internal.pageSize.getHeight();
      const margin  = 10;
      const usableW = pageW - margin * 2;
      let posY = margin;

      const addElement = async (el: HTMLElement | null) => {
        if (!el) return;
        const canvas  = await html2canvas(el, {
          scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false,
        });
        const imgData = canvas.toDataURL('image/png');
        const imgH    = (canvas.height * usableW) / canvas.width;
        if (posY + imgH > pageH - margin) { pdf.addPage(); posY = margin; }
        pdf.addImage(imgData, 'PNG', margin, posY, usableW, imgH);
        posY += imgH + 6;
      };

      await new Promise(r => setTimeout(r, 300));
      await addElement(document.getElementById('pdf-pedidos-header'));
      await addElement(document.getElementById('pdf-pedidos-table'));

      pdf.save(`agroconecta-pedidos-${new Date().toISOString().slice(0, 10)}.pdf`);

    } finally {
      this.exporting = false;
      this.cdr.detectChanges();
    }
  }
}