import { Component, OnInit, OnDestroy, ChangeDetectorRef, Inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DOCUMENT } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService, Order } from '../../core/services/order';
import { AuthService } from '../../core/services/auth';
import { DashboardService, DashboardKpis } from '../../core/services/dashboard';
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
export class Pedidos implements OnInit, OnDestroy {

  // ── Sidebar ──────────────────────────────────────────────────────────────
  sidebarOpen = false;

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  // ── Estado general ────────────────────────────────────────────────────────
  user: any = null;
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  displayedOrders: Order[] = [];
  loading = true;
  exporting = false;
  activeTab = 'all';
  selectedStatus = '';
  today = new Date();

  // ── Modal detalle ─────────────────────────────────────────────────────────
  selectedOrder: Order | null = null;

  // ── Menú dropdown ─────────────────────────────────────────────────────────
  openMenuId: number | null = null;

  // ── Paginación ────────────────────────────────────────────────────────────
  pageSize = 10;
  currentPage = 1;

  // ── KPIs ──────────────────────────────────────────────────────────────────
  kpisDashboard: DashboardKpis = {
    pedidos: 0,
    ventas: 0,
    agotados: 0,
    calificacion: 0
  };

  // ── Labels / iconos ───────────────────────────────────────────────────────
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

  // ── Listener de cierre de menús ───────────────────────────────────────────
  private boundCloseMenus!: (e: MouseEvent) => void;

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document
  ) { }

  // ════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ════════════════════════════════════════════════════════════════════════

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadOrders();
    this.loadKpis();
    this.boundCloseMenus = this.closeMenus.bind(this);
    this.document.addEventListener('click', this.boundCloseMenus);
  }

  ngOnDestroy(): void {
    this.document.removeEventListener('click', this.boundCloseMenus);
    // Garantiza que el overflow se restaura si el componente se destruye con el modal abierto
    this.document.body.style.overflow = '';
  }

  // ════════════════════════════════════════════════════════════════════════
  // HELPERS PRIVADOS
  // ════════════════════════════════════════════════════════════════════════

  private parseTotal(total: any): number {
    if (total === null || total === undefined || total === '') return 0;
    const cleaned = String(total)
      .trim()
      .replace(/[^\d.,]/g, '')
      .replace(',', '.');
    const parts = cleaned.split('.');
    const final = parts.length > 2
      ? parts.slice(0, -1).join('') + '.' + parts[parts.length - 1]
      : cleaned;
    const num = parseFloat(final);
    return isNaN(num) ? 0 : Math.round(num * 100) / 100;
  }

  private get ordersThisMonth(): Order[] {
    const now = new Date();
    return this.orders.filter(o => {
      const fecha = new Date(String(o.created_at ?? '').replace(' ', 'T'));
      if (isNaN(fecha.getTime())) return false;
      return fecha.getFullYear() === now.getFullYear() &&
        fecha.getMonth() === now.getMonth();
    });
  }

  private get ordersLastMonth(): Order[] {
    const now = new Date();
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return this.orders.filter(o => {
      const fecha = new Date(String(o.created_at ?? '').replace(' ', 'T'));
      if (isNaN(fecha.getTime())) return false;
      return fecha.getFullYear() === firstOfLastMonth.getFullYear() &&
        fecha.getMonth() === firstOfLastMonth.getMonth();
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // KPIs
  // ════════════════════════════════════════════════════════════════════════

  loadKpis(): void {
    this.dashboardService.getData().subscribe({
      next: (data) => {
        this.kpisDashboard = data.kpis;
        this.cdr.detectChanges();
      }
    });
  }

  get totalGanancias(): number {
    const num = parseFloat(String(this.kpisDashboard.ventas ?? 0).replace(',', '.'));
    return isNaN(num) ? 0 : Math.round(num * 100) / 100;
  }

  get totalPedidos(): number {
    return this.ordersThisMonth.length;
  }

  get pendingCount(): number {
    return this.orders.filter(o => o.status === 'pending').length;
  }

  get processingCount(): number {
    return this.orders.filter(o => o.status === 'processing').length;
  }

  get deliveredCount(): number {
    return this.orders.filter(o => o.status === 'delivered').length;
  }

  // ════════════════════════════════════════════════════════════════════════
  // COMPARATIVA VS MES ANTERIOR
  // ════════════════════════════════════════════════════════════════════════

  get pedidosVsMesAnterior(): string {
    const anterior = this.ordersLastMonth.length;
    if (anterior === 0) return '';
    const pct = Math.round(((this.totalPedidos - anterior) / anterior) * 100);
    return pct >= 0 ? `+${pct}% vs mes ant.` : `${pct}% vs mes ant.`;
  }

  get gananciasVsMesAnterior(): string {
    const gananciasAnterior = this.ordersLastMonth
      .filter(o => o.status !== 'cancelled')
      .reduce((s, o) => s + this.parseTotal(o.total), 0);
    if (gananciasAnterior === 0) return '';
    const pct = Math.round(((this.totalGanancias - gananciasAnterior) / gananciasAnterior) * 100);
    return pct >= 0 ? `+${pct}% vs mes ant.` : `${pct}% vs mes ant.`;
  }

  isPctNegative(pct: string): boolean {
    return pct.startsWith('-');
  }

  // ════════════════════════════════════════════════════════════════════════
  // PAGINACIÓN
  // ════════════════════════════════════════════════════════════════════════

  get hasMoreOrders(): boolean {
    return this.displayedOrders.length < this.filteredOrders.length;
  }

  get remainingCount(): number {
    return this.filteredOrders.length - this.displayedOrders.length;
  }

  loadMore(): void {
    this.currentPage++;
    this.displayedOrders = this.filteredOrders.slice(0, this.currentPage * this.pageSize);
    this.cdr.detectChanges();
  }

  // ════════════════════════════════════════════════════════════════════════
  // CARGA DE DATOS
  // ════════════════════════════════════════════════════════════════════════

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

  // ════════════════════════════════════════════════════════════════════════
  // FILTROS Y BÚSQUEDA
  // ════════════════════════════════════════════════════════════════════════

  applyFilters(): void {
    let result = [...this.orders];
    if (this.activeTab !== 'all') result = result.filter(o => o.status === this.activeTab);
    if (this.selectedStatus) result = result.filter(o => o.status === this.selectedStatus);
    this.filteredOrders = result;
    this.currentPage = 1;
    this.displayedOrders = this.filteredOrders.slice(0, this.pageSize);
  }

  onSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value.toLowerCase().trim();
    if (!term) { this.applyFilters(); return; }
    this.filteredOrders = this.orders.filter(o =>
      o.buyer?.name?.toLowerCase().includes(term) ||
      String(o.id).includes(term)
    );
    this.currentPage = 1;
    this.displayedOrders = this.filteredOrders.slice(0, this.pageSize);
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    this.applyFilters();
  }

  // ════════════════════════════════════════════════════════════════════════
  // ACCIONES DE PEDIDO
  // ════════════════════════════════════════════════════════════════════════

  updateStatus(orderId: number, status: string): void {
    this.orderService.updateOrderStatus(orderId, status).subscribe({
      next: (updated) => {
        const order = this.orders.find(o => o.id === orderId);
        if (order) order.status = updated.status as OrderStatus;
        if (this.selectedOrder?.id === orderId) {
          this.selectedOrder = { ...this.selectedOrder, status: updated.status as OrderStatus };
        }

        this.applyFilters();
        this.openMenuId = null;
        this.cdr.detectChanges();
      }
    });
  }

  toggleMenu(id: number, event: MouseEvent): void {
    event.stopPropagation();
    const wasOpen = this.openMenuId === id;
    this.openMenuId = wasOpen ? null : id;
  }

  closeMenus(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.actions-menu')) {
      this.openMenuId = null;
      this.cdr.detectChanges();
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // MODAL DETALLE
  // ════════════════════════════════════════════════════════════════════════

  openOrderDetail(order: Order): void {
    console.log('ORDER COMPLETO:', JSON.stringify(order, null, 2));
    this.selectedOrder = order;
    this.openMenuId = null;
    this.document.body.style.overflow = 'hidden';
  }

  closeOrderDetail(): void {
    this.selectedOrder = null;
    this.openMenuId = null;
    this.document.body.style.overflow = '';
  }

  // ════════════════════════════════════════════════════════════════════════
  // AVATAR
  // ════════════════════════════════════════════════════════════════════════

  getAvatarColor(name: string): string {
    const colors = ['#dcfce7', '#dbeafe', '#fef9c3', '#f3e8ff', '#ffedd5'];
    return colors[(name?.length || 0) % colors.length];
  }

  getAvatarTextColor(name: string): string {
    const colors = ['#16a34a', '#3b82f6', '#ca8a04', '#9333ea', '#f97316'];
    return colors[(name?.length || 0) % colors.length];
  }

  // ════════════════════════════════════════════════════════════════════════
  // EXPORTAR PDF
  // ════════════════════════════════════════════════════════════════════════

  async exportPDF(): Promise<void> {
    if (this.exporting) return;
    this.exporting = true;
    this.cdr.detectChanges();

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const usableW = pageW - margin * 2;
      let posY = margin;

      const addElement = async (el: HTMLElement | null) => {
        if (!el) return;
        const canvas = await html2canvas(el, {
          scale: 2, backgroundColor: '#ffffff',
          useCORS: true, logging: false
        });
        const imgData = canvas.toDataURL('image/png');
        const imgH = (canvas.height * usableW) / canvas.width;
        if (posY + imgH > pageH - margin) { pdf.addPage(); posY = margin; }
        pdf.addImage(imgData, 'PNG', margin, posY, usableW, imgH);
        posY += imgH + 6;
      };

      await new Promise(r => setTimeout(r, 300));
      await addElement(this.document.getElementById('pdf-pedidos-header'));
      await addElement(this.document.getElementById('pdf-pedidos-table'));

      pdf.save(`agroconecta-pedidos-${new Date().toISOString().slice(0, 10)}.pdf`);

    } finally {
      this.exporting = false;
      this.cdr.detectChanges();
    }
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const icon = img.nextElementSibling as HTMLElement;
    if (icon) icon.style.display = 'flex';
  }

  getItemPrice(item: any): number {
    const subtotal = parseFloat(String(item.subtotal ?? 0));
    const price = parseFloat(String(item.price ?? 0));
    const val = subtotal > 0 ? subtotal : price * (item.quantity || 1);
    return isNaN(val) ? 0 : Math.round(val * 100) / 100;
  }

}