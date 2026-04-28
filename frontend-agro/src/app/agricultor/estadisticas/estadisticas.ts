import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { Sidebar } from '../sidebar/sidebar';
import { StatsService } from '../../core/services/stats.service';
import { NgApexchartsModule } from 'ng-apexcharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { environment } from '../../../environments/environment';
 
@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyPipe, DecimalPipe, NgApexchartsModule, Sidebar],
  templateUrl: './estadisticas.html',
  styleUrls: ['./estadisticas.css'],
})
export class Estadisticas implements OnInit {
  sidebarOpen = false;
  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
  user: any = null;
  dashboard: any = null;
  loading = true;
  error = false;
  exporting = false;
 
  today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  mesActualLabel = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
 
  readonly PLACEHOLDER_IMAGE = 'assets/images/placeholder.png';
  readonly API_BASE = environment.apiUrl;
 
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
 
  statusColors: Record<string, string> = {
    pending: '#f59e0b',
    processing: '#3b82f6',
    shipped: '#8b5cf6',
    delivered: '#16a34a',
    cancelled: '#ef4444',
  };
 
  heatmapEmpty = false;
  scatterEmpty = false;
  stackedEmpty = false;
  prevYearVisible = false;
 
  statusBars: Array<{
    key: string; label: string; color: string; icon: string;
    count: number; pct: number;
  }> = [];
 
  lowStockItems: Array<{
    id: number; name: string; stock: number; unit: string;
    image: string; pct: number; critical: boolean;
  }> = [];
  readonly LOW_STOCK_MAX = 10;
 
  areaOptions: any = {};
  comboOptions: any = {};
  donutOptions: any = {};
  heatmapOptions: any = {};
  scatterOptions: any = {};
  stackedOptions: any = {};
 
  constructor(
    private statsService: StatsService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}
 
  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadStats();
  }
 
  private fixImageUrl(url: string | null | undefined): string {
    if (!url) return this.PLACEHOLDER_IMAGE;
 
    const clean = String(url).replace(/\\/g, '');
    if (clean.startsWith('http://localhost') || clean.startsWith('https://localhost')) {
      return clean.replace(/^https?:\/\/localhost:\d+/, this.API_BASE);
    }
 
    if (clean.startsWith('/storage/')) return `${this.API_BASE}${clean}`;
    if (clean.startsWith('storage/')) return `${this.API_BASE}/${clean}`;
    if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
 
    return `${this.API_BASE}/storage/${clean.replace(/^\/+/, '')}`;
  }
 
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== this.PLACEHOLDER_IMAGE) {
      img.src = this.PLACEHOLDER_IMAGE;
    }
  }
 
  get totalGanancias(): number {
    return (this.dashboard?.monthly_revenue ?? []).reduce((acc: number, m: any) => {
      const v = parseFloat(String(m.total ?? 0).replace(',', '.'));
      return acc + (isNaN(v) ? 0 : v);
    }, 0);
  }
 
  get totalPedidosStatus(): number {
    const series = this.donutOptions?.series ?? [];
    return (series as number[]).reduce((a: number, b: number) => a + b, 0);
  }
 
  getStatusPct(value: number, total: number): number {
    if (!total || !value) return 0;
    return Math.round((value / total) * 100);
  }
 
  getPct(value: number): string {
    if (!this.totalPedidosStatus) return '0';
    return ((value / this.totalPedidosStatus) * 100).toFixed(1);
  }
 
  getStarsArray(rating: number): { full: boolean; half: boolean }[] {
    return Array.from({ length: 5 }, (_, i) => ({
      full: i < Math.floor(rating),
      half: i === Math.floor(rating) && rating % 1 >= 0.5,
    }));
  }
 
  getStatusLabel(status: string): string {
    return this.statusLabels[status] ?? status;
  }
 
  getAvatarColor(name: string): string {
    const colors = ['#dcfce7', '#dbeafe', '#fef9c3', '#f3e8ff', '#ffedd5'];
    return colors[(name?.length || 0) % colors.length];
  }
 
  getBarWidth(sold: number): number {
    const max = Math.max(...(this.dashboard?.top_products ?? []).map((p: any) => p.sold ?? 0), 1);
    return (sold / max) * 100;
  }
 
  getStockPct(stock: number): number {
    return Math.min(Math.round((stock / this.LOW_STOCK_MAX) * 100), 100);
  }
 
  getInitials(name: string): string {
    return (name ?? '?')
      .split(' ')
      .slice(0, 2)
      .map((n: string) => n[0])
      .join('')
      .toUpperCase();
  }
 
  getOrderSummary(order: any): string {
    if (!order?.items?.length) return '—';
    const first = order.items[0]?.product?.name ?? '—';
    const extra = order.items.length - 1;
    return extra > 0 ? `${first} +${extra} más` : first;
  }
 
  trackById(_: number, item: any): number {
    return item.id;
  }
 
  loadStats(): void {
    this.loading = true;
    this.error = false;
 
    this.statsService.getFarmerStats().subscribe({
      next: (data: any) => {
        this.dashboard = data;
        try {
          this.buildStatusBars(data.orders_by_status ?? []);
          this.buildLowStock(data.low_stock ?? []);
          this.buildCharts(data);
        } catch (e) {
          console.error('buildCharts error', e);
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = true;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
 
  private buildStatusBars(raw: any[]): void {
    const total = raw.reduce((s: number, r: any) => s + r.count, 0) || 1;
    const order = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
 
    this.statusBars = order
      .map(key => {
        const found = raw.find((r: any) => r.status === key);
        if (!found) return null;
        return {
          key,
          label: this.statusLabels[key] ?? key,
          color: this.statusColors[key] ?? '#94a3b8',
          icon: this.statusIcons[key] ?? 'circle',
          count: found.count,
          pct: Math.round((found.count / total) * 100),
        };
      })
      .filter(Boolean) as this['statusBars'];
  }
 
  private buildLowStock(raw: any[]): void {
    this.lowStockItems = raw.map((p: any) => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      unit: p.unit,
      image: this.fixImageUrl(p.image),
      pct: Math.min(Math.round((p.stock / this.LOW_STOCK_MAX) * 100), 100),
      critical: p.stock <= 3,
    }));
  }
 
  getTopProducts(): any[] {
    return (this.dashboard?.top_products ?? []).map((p: any) => ({
      ...p,
      image: this.fixImageUrl(p.image),
    }));
  }
 
  private buildCharts(data: any): void {
    const monthly: any[] = data.monthly_revenue ?? [];
    const prevYear: any = data.prev_year_revenue ?? {};
 
    const labels = monthly.map((m: any) => this.meses[(m.month ?? 1) - 1]);
    const revenue = monthly.map((m: any) => Math.round(parseFloat(m.total ?? 0) * 100) / 100);
    const orders = monthly.map((m: any) => parseInt(m.orders_count ?? 0));
    const tickets = monthly.map((m: any) => {
      const cnt = parseInt(m.orders_count ?? 0);
      const tot = parseFloat(m.total ?? 0);
      return cnt > 0 ? Math.round((tot / cnt) * 100) / 100 : 0;
    });
 
    const prevRevenue = monthly.map((m: any) => {
      const prev = prevYear[String(m.month)];
      if (!prev) return 0;
      const val = parseFloat(prev.total ?? 0);
      return isNaN(val) ? 0 : Math.round(val * 100) / 100;
    });
 
    this.prevYearVisible = prevRevenue.some((v: number) => v > 0);
 
    this.buildArea(labels, revenue, prevRevenue);
    this.buildCombo(labels, orders, tickets);
    this.buildDonut(data.orders_by_status ?? []);
    this.buildHeatmap(data.heatmap ?? []);
    this.buildScatter(data.scatter_products ?? []);
    this.buildStacked(data.stacked_by_category ?? []);
  }
 
  private buildArea(labels: string[], revenue: number[], prevRevenue: number[]): void {
    const maxVal = Math.max(...revenue, 0);
    const maxIdx = revenue.indexOf(maxVal);
    const maxLabel = labels[maxIdx] ?? '';
 
    const series = this.prevYearVisible
      ? [
          { name: 'Este año', data: revenue },
          { name: 'Año anterior', data: prevRevenue },
        ]
      : [{ name: 'Este año', data: revenue }];
 
    const colors = this.prevYearVisible ? ['#11C267', '#94a3b8'] : ['#11C267'];
    const strokeWidth = this.prevYearVisible ? [2.5, 1.5] : [2.5];
    const dashArray = this.prevYearVisible ? [0, 5] : [0];
    const markerSizes = this.prevYearVisible ? [4, 3] : [4];
 
    this.areaOptions = {
      series,
      chart: {
        type: 'area', height: 280,
        toolbar: { show: false },
        background: 'transparent',
        animations: { enabled: true, speed: 700 },
      },
      stroke: { curve: 'smooth', width: strokeWidth, dashArray },
      fill: {
        type: series.map(() => 'gradient'),
        gradient: {
          shadeIntensity: 1,
          opacityFrom: this.prevYearVisible ? [0.35, 0.12] : [0.35],
          opacityTo: this.prevYearVisible ? [0.02, 0.01] : [0.02],
        },
      },
      dataLabels: { enabled: false },
      markers: { size: markerSizes, strokeWidth: 2, hover: { size: 6 } },
      grid: { borderColor: '#f1f5f9', strokeDashArray: 4, xaxis: { lines: { show: false } } },
      colors,
      xaxis: {
        categories: labels,
        labels: { style: { colors: '#94a3b8', fontSize: '11px' } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: { colors: '#94a3b8', fontSize: '10px' },
          formatter: (v: number) => v.toFixed(0) + '€',
        },
      },
      tooltip: {
        theme: 'light', shared: true, intersect: false,
        y: { formatter: (v: number) => v.toFixed(2) + ' €' },
      },
      legend: {
        show: this.prevYearVisible,
        fontSize: '12px',
        labels: { colors: '#6b7280' },
      },
      annotations: maxVal > 0 ? {
        points: [{
          x: maxLabel,
          y: maxVal,
          marker: { size: 7, fillColor: '#11C267', strokeColor: '#fff', strokeWidth: 2 },
          label: {
            text: `Máx: ${maxVal.toFixed(0)}€`,
            style: {
              color: '#fff', background: '#11C267',
              fontSize: '11px', fontWeight: '700',
              padding: { left: 8, right: 8, top: 4, bottom: 4 },
            },
            offsetY: -12,
          },
        }],
      } : {},
    };
  }
 
  private buildCombo(labels: string[], orders: number[], tickets: number[]): void {
    this.comboOptions = {
      series: [
        { name: 'Pedidos', type: 'bar', data: orders },
        { name: 'Ticket medio', type: 'line', data: tickets },
      ],
      chart: {
        type: 'line', height: 260,
        toolbar: { show: false },
        background: 'transparent',
        animations: { enabled: true, speed: 700 },
      },
      stroke: { curve: 'smooth', width: [0, 2.5] },
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: '52%',
          colors: { ranges: this.getBarColorRanges(orders) },
        },
      },
      fill: {
        type: ['gradient', 'solid'],
        gradient: {
          shade: 'light', type: 'vertical',
          shadeIntensity: 0.25,
          gradientToColors: ['#4ade80'],
          opacityFrom: 1, opacityTo: 0.7,
        },
      },
      dataLabels: { enabled: false },
      markers: { size: [0, 4], strokeWidth: 2, hover: { size: 6 } },
      grid: { borderColor: '#f1f5f9', strokeDashArray: 4, xaxis: { lines: { show: false } } },
      colors: ['#11C267', '#f97316'],
      xaxis: {
        categories: labels,
        labels: { style: { colors: '#94a3b8', fontSize: '11px' } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: [
        {
          title: { text: 'Pedidos', style: { color: '#11C267', fontSize: '11px' } },
          labels: { style: { colors: '#94a3b8', fontSize: '10px' } },
        },
        {
          opposite: true,
          title: { text: 'Ticket (€)', style: { color: '#f97316', fontSize: '11px' } },
          labels: {
            style: { colors: '#94a3b8', fontSize: '10px' },
            formatter: (v: number) => v.toFixed(0) + '€',
          },
        },
      ],
      tooltip: {
        theme: 'light', shared: true, intersect: false,
        y: [
          { formatter: (v: number) => v + ' pedidos' },
          { formatter: (v: number) => v.toFixed(2) + ' €' },
        ],
      },
    };
  }
 
  private buildDonut(statuses: any[]): void {
    const totalOrds = statuses.reduce((s: number, x: any) => s + x.count, 0);
    const delivered = statuses.find((s: any) => s.status === 'delivered')?.count ?? 0;
    const pctDelivered = totalOrds > 0 ? Math.round((delivered / totalOrds) * 100) : 0;
 
    this.donutOptions = {
      series: statuses.map((s: any) => s.count),
      labels: statuses.map((s: any) => this.statusLabels[s.status] ?? s.status),
      colors: statuses.map((s: any) => this.statusColors[s.status] ?? '#94a3b8'),
      chart: {
        type: 'donut', height: 200,
        background: 'transparent',
        animations: { enabled: true, speed: 600 },
      },
      legend: { show: false },
      dataLabels: { enabled: false },
      stroke: { width: 2, colors: ['#fff'] },
      plotOptions: {
        pie: {
          donut: {
            size: '72%',
            labels: {
              show: true,
              name: {
                show: true, fontSize: '12px',
                color: '#94a3b8', offsetY: -8,
              },
              value: {
                show: true, fontSize: '24px',
                fontWeight: '800', color: '#111827', offsetY: 4,
                formatter: () => pctDelivered + '%',
              },
              total: {
                show: true, label: 'Entregados',
                fontSize: '11px', color: '#94a3b8',
                formatter: () => pctDelivered + '%',
              },
            },
          },
        },
      },
      responsive: [{ breakpoint: 480, options: { chart: { height: 160 } } }],
      tooltip: { theme: 'light', y: { formatter: (v: number) => v + ' pedidos' } },
    };
  }
 
  private buildHeatmap(heatRaw: any[]): void {
    this.heatmapEmpty = heatRaw.length === 0;
    if (this.heatmapEmpty) return;
 
    const matrix: Record<number, Record<number, number>> = {};
    for (let d = 1; d <= 7; d++) {
      matrix[d] = {};
      for (let h = 0; h < 24; h++) matrix[d][h] = 0;
    }
 
    heatRaw.forEach((r: any) => {
      const d = parseInt(r.day_of_week);
      const h = parseInt(r.hour);
      if (matrix[d]) matrix[d][h] = parseInt(r.count ?? 0);
    });
 
    const orderedDays: { name: string; mysqlIdx: number }[] = [
      { name: 'Lun', mysqlIdx: 2 },
      { name: 'Mar', mysqlIdx: 3 },
      { name: 'Mié', mysqlIdx: 4 },
      { name: 'Jue', mysqlIdx: 5 },
      { name: 'Vie', mysqlIdx: 6 },
      { name: 'Sáb', mysqlIdx: 7 },
      { name: 'Dom', mysqlIdx: 1 },
    ];
 
    const heatSeries = orderedDays.map(({ name, mysqlIdx }) => ({
      name,
      data: Array.from({ length: 24 }, (_, h) => ({
        x: `${h}h`,
        y: matrix[mysqlIdx]?.[h] ?? 0,
      })),
    }));
 
    this.heatmapOptions = {
      series: heatSeries,
      chart: {
        type: 'heatmap', height: 210,
        toolbar: { show: false },
        background: 'transparent',
        animations: { enabled: true, speed: 600 },
      },
      dataLabels: { enabled: false },
      stroke: { width: 3, colors: ['#fff'] },
      colors: ['#11C267'],
      plotOptions: {
        heatmap: {
          radius: 4,
          enableShades: true,
          shadeIntensity: 0.5,
          colorScale: {
            ranges: [
              { from: 0, to: 0, color: '#f1f5f9', name: 'Sin pedidos' },
              { from: 1, to: 2, color: '#bbf7d0', name: 'Bajo' },
              { from: 3, to: 5, color: '#4ade80', name: 'Medio' },
              { from: 6, to: 999, color: '#16a34a', name: 'Alto' },
            ],
          },
        },
      },
      xaxis: {
        tickAmount: 8,
        labels: {
          style: { colors: '#94a3b8', fontSize: '10px' },
          rotate: 0,
          hideOverlappingLabels: true,
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: { style: { colors: '#6b7280', fontSize: '11px' } },
      },
      tooltip: {
        theme: 'light',
        y: { formatter: (v: number) => v + (v === 1 ? ' pedido' : ' pedidos') },
      },
    };
  }
 
  private buildScatter(scatter: any[]): void {
    this.scatterEmpty = scatter.length === 0;
    if (this.scatterEmpty) return;
 
    // Calcular rango real de precios para tickAmount dinámico
    const prices = scatter.map((p: any) => parseFloat(p.price));
    const minPrice = Math.floor(Math.min(...prices));
    const maxPrice = Math.ceil(Math.max(...prices));
 
    this.scatterOptions = {
      series: [{
        name: 'Producto',
        data: scatter.map((p: any) => ({
          x: parseFloat(p.price),
          y: parseInt(p.sold),
          meta: p.name,
        })),
      }],
      chart: {
        type: 'scatter', height: 260,
        toolbar: { show: false },
        background: 'transparent',
        zoom: { enabled: false },
        animations: { enabled: true, speed: 600 },
      },
      colors: ['#11C267'],
      // Puntos más pequeños para evitar solapamiento
      markers: { size: 6, strokeWidth: 0, hover: { sizeOffset: 2 } },
      dataLabels: { enabled: false },
      grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
      xaxis: {
        title: { text: 'Precio (€)', style: { color: '#94a3b8', fontSize: '11px' } },
        // Limitar etiquetas a 8 máximo para que no se apilen
        tickAmount: 8,
        min: minPrice > 0 ? minPrice - 1 : 0,
        max: maxPrice + 1,
        labels: {
          style: { colors: '#94a3b8', fontSize: '10px' },
          // Sin rotación + ocultar las que colisionan
          rotate: 0,
          hideOverlappingLabels: true,
          formatter: (v: number) => parseFloat(String(v)).toFixed(0) + '€',
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        title: { text: 'Uds. vendidas', style: { color: '#94a3b8', fontSize: '11px' } },
        tickAmount: 5,
        min: 0,
        labels: {
          style: { colors: '#94a3b8', fontSize: '10px' },
          // Siempre enteros en el eje Y
          formatter: (v: number) => Math.round(v).toString(),
        },
      },
      tooltip: {
        theme: 'light',
        custom: ({ seriesIndex, dataPointIndex, w }: any) => {
          const d = w.config.series[seriesIndex].data[dataPointIndex];
          const name = d.meta ?? '—';
          return `
            <div style="padding:8px 12px;font-size:12px;font-weight:600;color:#111;border-radius:8px">
              <div style="margin-bottom:4px;font-size:13px">${name}</div>
              <div style="color:#11C267">💰 Precio: ${parseFloat(String(d.x)).toFixed(2)}€</div>
              <div style="color:#3b82f6">📦 Vendidos: ${d.y} uds.</div>
            </div>`;
        },
      },
    };
  }
 
  private buildStacked(stacked: any[]): void {
    this.stackedEmpty = stacked.length === 0;
    if (this.stackedEmpty) return;
 
    const stackedMonths = [...new Set(stacked.map((r: any) => this.meses[(r.month ?? 1) - 1] + ' ' + String(r.year).slice(-2)))];
    const categories = [...new Set(stacked.map((r: any) => r.category as string))];
    const catColors = ['#11C267', '#3b82f6', '#f97316', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6'];
 
    const stackedSeries = categories.map((cat, ci) => ({
      name: cat,
      color: catColors[ci % catColors.length],
      data: stackedMonths.map(ml => {
        const [mon, yr] = ml.split(' ');
        const found = stacked.find((r: any) =>
          r.category === cat &&
          this.meses[(r.month ?? 1) - 1] === mon &&
          String(r.year).slice(-2) === yr,
        );
        return found ? Math.round(parseFloat(found.total ?? 0) * 100) / 100 : 0;
      }),
    }));
 
    this.stackedOptions = {
      series: stackedSeries,
      colors: catColors,
      chart: {
        type: 'bar', height: 260,
        stacked: true,
        toolbar: { show: false },
        background: 'transparent',
        animations: { enabled: true, speed: 600 },
      },
      plotOptions: {
        bar: { borderRadius: 4, columnWidth: '55%', borderRadiusApplication: 'end' },
      },
      dataLabels: { enabled: false },
      fill: { opacity: 1 },
      grid: { borderColor: '#f1f5f9', strokeDashArray: 4, xaxis: { lines: { show: false } } },
      xaxis: {
        categories: stackedMonths,
        labels: { style: { colors: '#94a3b8', fontSize: '10px' } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: { colors: '#94a3b8', fontSize: '10px' },
          formatter: (v: number) => v.toFixed(0) + '€',
        },
      },
      legend: { position: 'top', fontSize: '11px', labels: { colors: '#374151' } },
      tooltip: {
        theme: 'light', shared: true, intersect: false,
        y: { formatter: (v: number) => v.toFixed(2) + ' €' },
      },
    };
  }
 
  private getBarColorRanges(orders: number[]): { from: number; to: number; color: string }[] {
    if (!orders.length) return [];
    if (Math.max(...orders) === 0) return [];
    const max = Math.max(...orders);
    return [
      { from: 0, to: max * 0.33, color: '#4ade80' },
      { from: max * 0.33 + 1, to: max * 0.66, color: '#22c55e' },
      { from: max * 0.66 + 1, to: max * 2, color: '#15803d' },
    ];
  }
 
  async exportPDF(): Promise<void> {
    if (this.exporting) return;
    this.exporting = true;
    this.cdr.detectChanges();
 
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const useW = pageW - margin * 2;
      let posY = margin;
 
      const addEl = async (id: string) => {
        const el = document.getElementById(id);
        if (!el) return;
        const canvas = await html2canvas(el, {
          scale: 2, backgroundColor: '#ffffff',
          useCORS: true, logging: false,
        });
        const imgData = canvas.toDataURL('image/png');
        const imgH = (canvas.height * useW) / canvas.width;
        if (posY + imgH > pageH - margin) { pdf.addPage(); posY = margin; }
        pdf.addImage(imgData, 'PNG', margin, posY, useW, imgH);
        posY += imgH + 6;
      };
 
      await new Promise(r => setTimeout(r, 600));
      await addEl('pdf-farmer-header');
      await addEl('pdf-chart-ingresos');
      await addEl('pdf-chart-combo');
      await addEl('pdf-chart-dona-stock');
      await addEl('pdf-heatmap');
      await addEl('pdf-scatter-stacked');
      await addEl('pdf-bottom');
 
      pdf.save(`agroconecta-informe-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      this.exporting = false;
      this.cdr.detectChanges();
    }
  }
}