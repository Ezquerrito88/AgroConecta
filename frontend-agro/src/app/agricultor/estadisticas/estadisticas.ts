import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { Sidebar } from '../sidebar/sidebar';
import { StatsService } from '../../core/services/stats.service';
import { NgApexchartsModule } from 'ng-apexcharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyPipe, DecimalPipe, NgApexchartsModule, Sidebar],
  templateUrl: './estadisticas.html',
  styleUrls: ['./estadisticas.css'],
})
export class Estadisticas implements OnInit {

  user: any      = null;
  dashboard: any = null;
  loading        = true;
  error          = false;
  exporting      = false;

  today          = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  mesActualLabel = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  meses          = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  dias           = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

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
  statusColors: Record<string, string> = {
    pending:    '#f59e0b',
    processing: '#3b82f6',
    shipped:    '#8b5cf6',
    delivered:  '#16a34a',
    cancelled:  '#ef4444',
  };

  // ── Flags empty states ────────────────────────────────────────
  heatmapEmpty    = false;
  scatterEmpty    = false;
  stackedEmpty    = false;
  prevYearVisible = false;

  // ── Status bars procesadas ────────────────────────────────────
  statusBars: Array<{
    key: string; label: string; color: string; icon: string;
    count: number; pct: number;
  }> = [];

  // ── Low stock procesado ───────────────────────────────────────
  lowStockItems: Array<{
    id: number; name: string; stock: number; unit: string;
    image: string; pct: number; critical: boolean;
  }> = [];
  readonly LOW_STOCK_MAX = 10;

  // ── Opciones gráficas ─────────────────────────────────────────
  areaOptions:    any = {};
  comboOptions:   any = {};
  donutOptions:   any = {};
  heatmapOptions: any = {};
  scatterOptions: any = {};
  stackedOptions: any = {};

  constructor(
    private statsService: StatsService,
    private authService:  AuthService,
    private cdr:          ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadStats();
  }

  // ══════════════════════════════════════════════════════════════
  //  GETTERS
  // ══════════════════════════════════════════════════════════════

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

  // ══════════════════════════════════════════════════════════════
  //  HELPERS PÚBLICOS
  // ══════════════════════════════════════════════════════════════

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
    const max = Math.max(
      ...(this.dashboard?.top_products ?? []).map((p: any) => p.sold ?? 0), 1,
    );
    return (sold / max) * 100;
  }

  /** Ancho de barra de stock bajo (sobre LOW_STOCK_MAX = 10) */
  getStockPct(stock: number): number {
    return Math.min(Math.round((stock / this.LOW_STOCK_MAX) * 100), 100);
  }

  /** Iniciales para avatar de cliente en tabla */
  getInitials(name: string): string {
    return (name ?? '?')
      .split(' ')
      .slice(0, 2)
      .map((n: string) => n[0])
      .join('')
      .toUpperCase();
  }

  /** Resumen de artículos de un pedido */
  getOrderSummary(order: any): string {
    if (!order?.items?.length) return '—';
    const first = order.items[0]?.product?.name ?? '—';
    const extra = order.items.length - 1;
    return extra > 0 ? `${first} +${extra} más` : first;
  }

  /** trackBy para ngFor */
  trackById(_: number, item: any): number {
    return item.id;
  }

  // ══════════════════════════════════════════════════════════════
  //  CARGA DE DATOS
  // ══════════════════════════════════════════════════════════════

  loadStats(): void {
    this.loading = true;
    this.error   = false;

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
        this.error   = true;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ══════════════════════════════════════════════════════════════
  //  PROCESADO PREVIO AL RENDER
  // ══════════════════════════════════════════════════════════════

  /** Construye el array statusBars para las barras horizontales del template */
  private buildStatusBars(raw: any[]): void {
    const total  = raw.reduce((s: number, r: any) => s + r.count, 0) || 1;
    const order  = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    this.statusBars = order
      .map(key => {
        const found = raw.find((r: any) => r.status === key);
        if (!found) return null;
        return {
          key,
          label: this.statusLabels[key]  ?? key,
          color: this.statusColors[key]  ?? '#94a3b8',
          icon:  this.statusIcons[key]   ?? 'circle',
          count: found.count,
          pct:   Math.round((found.count / total) * 100),
        };
      })
      .filter(Boolean) as this['statusBars'];
  }

  /** Construye el array lowStockItems con % y flag critical */
  private buildLowStock(raw: any[]): void {
    this.lowStockItems = raw.map((p: any) => ({
      id:       p.id,
      name:     p.name,
      stock:    p.stock,
      unit:     p.unit,
      image:    p.image,
      pct:      Math.min(Math.round((p.stock / this.LOW_STOCK_MAX) * 100), 100),
      critical: p.stock <= 3,
    }));
  }

  // ══════════════════════════════════════════════════════════════
  //  BUILD CHARTS
  // ══════════════════════════════════════════════════════════════

  private buildCharts(data: any): void {
    const monthly: any[] = data.monthly_revenue  ?? [];
    const prevYear: any  = data.prev_year_revenue ?? {};

    const labels  = monthly.map((m: any) => this.meses[(m.month ?? 1) - 1]);
    const revenue = monthly.map((m: any) =>
      Math.round(parseFloat(m.total ?? 0) * 100) / 100,
    );
    const orders  = monthly.map((m: any) => parseInt(m.orders_count ?? 0));
    const tickets = monthly.map((m: any) => {
      const cnt = parseInt(m.orders_count ?? 0);
      const tot = parseFloat(m.total ?? 0);
      return cnt > 0 ? Math.round((tot / cnt) * 100) / 100 : 0;
    });

    // ── Año anterior: clave numérica del mes, filtrado a año anterior exacto
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

  // ── GRÁFICA 1: Área doble (actual vs año anterior) ────────────
  private buildArea(labels: string[], revenue: number[], prevRevenue: number[]): void {
    const maxVal   = Math.max(...revenue, 0);
    const maxIdx   = revenue.indexOf(maxVal);
    const maxLabel = labels[maxIdx] ?? '';

    const series = this.prevYearVisible
      ? [
          { name: 'Este año',     data: revenue     },
          { name: 'Año anterior', data: prevRevenue },
        ]
      : [{ name: 'Este año', data: revenue }];

    const colors      = this.prevYearVisible ? ['#11C267', '#94a3b8'] : ['#11C267'];
    const strokeWidth = this.prevYearVisible ? [2.5, 1.5] : [2.5];
    const dashArray   = this.prevYearVisible ? [0, 5]     : [0];
    const markerSizes = this.prevYearVisible ? [4, 3]     : [4];

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
          opacityTo:   this.prevYearVisible ? [0.02, 0.01] : [0.02],
        },
      },
      dataLabels: { enabled: false },
      markers:    { size: markerSizes, strokeWidth: 2, hover: { size: 6 } },
      grid:       { borderColor: '#f1f5f9', strokeDashArray: 4, xaxis: { lines: { show: false } } },
      colors,
      xaxis: {
        categories: labels,
        labels:     { style: { colors: '#94a3b8', fontSize: '11px' } },
        axisBorder: { show: false },
        axisTicks:  { show: false },
      },
      yaxis: {
        labels: {
          style:     { colors: '#94a3b8', fontSize: '10px' },
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

  // ── GRÁFICA 2: Combo barras + línea ──────────────────────────
  private buildCombo(labels: string[], orders: number[], tickets: number[]): void {
    this.comboOptions = {
      series: [
        { name: 'Pedidos',      type: 'bar',  data: orders  },
        { name: 'Ticket medio', type: 'line', data: tickets },
      ],
      chart: {
        type: 'line', height: 260,
        toolbar: { show: false },
        background: 'transparent',
        animations: { enabled: true, speed: 700 },
      },
      stroke:      { curve: 'smooth', width: [0, 2.5] },
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
      markers:    { size: [0, 4], strokeWidth: 2, hover: { size: 6 } },
      grid:       { borderColor: '#f1f5f9', strokeDashArray: 4, xaxis: { lines: { show: false } } },
      colors:     ['#11C267', '#f97316'],
      xaxis: {
        categories: labels,
        labels:     { style: { colors: '#94a3b8', fontSize: '11px' } },
        axisBorder: { show: false },
        axisTicks:  { show: false },
      },
      yaxis: [
        {
          title:  { text: 'Pedidos',    style: { color: '#11C267', fontSize: '11px' } },
          labels: { style: { colors: '#94a3b8', fontSize: '10px' } },
        },
        {
          opposite: true,
          title:    { text: 'Ticket (€)', style: { color: '#f97316', fontSize: '11px' } },
          labels:   {
            style:     { colors: '#94a3b8', fontSize: '10px' },
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

  // ── GRÁFICA 3: Dona ───────────────────────────────────────────
  private buildDonut(statuses: any[]): void {
    const totalOrds    = statuses.reduce((s: number, x: any) => s + x.count, 0);
    const delivered    = statuses.find((s: any) => s.status === 'delivered')?.count ?? 0;
    const pctDelivered = totalOrds > 0 ? Math.round((delivered / totalOrds) * 100) : 0;

    this.donutOptions = {
      series:  statuses.map((s: any) => s.count),
      labels:  statuses.map((s: any) => this.statusLabels[s.status] ?? s.status),
      colors:  statuses.map((s: any) => this.statusColors[s.status] ?? '#94a3b8'),
      chart: {
        type: 'donut', height: 200,
        background: 'transparent',
        animations: { enabled: true, speed: 600 },
      },
      legend:      { show: false },
      dataLabels:  { enabled: false },
      stroke:      { width: 2, colors: ['#fff'] },
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
      tooltip:    { theme: 'light', y: { formatter: (v: number) => v + ' pedidos' } },
    };
  }

  // ── GRÁFICA 4: Mapa de calor ──────────────────────────────────
  private buildHeatmap(heatRaw: any[]): void {
    this.heatmapEmpty = heatRaw.length === 0;
    if (this.heatmapEmpty) return;

    // MySQL DAYOFWEEK: 1=Dom … 7=Sáb
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

    // Reordenamos Lun(2)→Dom(1) para que Lun sea la primera fila
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
        type: 'heatmap', height: 260,
        toolbar: { show: false },
        background: 'transparent',
        animations: { enabled: true, speed: 600 },
      },
      dataLabels: { enabled: false },
      stroke:     { width: 2, colors: ['#fff'] },
      colors:     ['#11C267'],
      plotOptions: {
        heatmap: {
          radius: 4,
          enableShades: true,
          shadeIntensity: 0.5,
          colorScale: {
            ranges: [
              { from: 0,   to: 0,   color: '#f1f5f9', name: 'Sin pedidos' },
              { from: 1,   to: 2,   color: '#bbf7d0', name: 'Bajo'        },
              { from: 3,   to: 5,   color: '#4ade80', name: 'Medio'       },
              { from: 6,   to: 999, color: '#16a34a', name: 'Alto'        },
            ],
          },
        },
      },
      xaxis: {
        labels:     { style: { colors: '#94a3b8', fontSize: '10px' } },
        axisBorder: { show: false },
        axisTicks:  { show: false },
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

  // ── GRÁFICA 5: Dispersión precio vs vendidos ──────────────────
  private buildScatter(scatter: any[]): void {
    this.scatterEmpty = scatter.length === 0;
    if (this.scatterEmpty) return;

    this.scatterOptions = {
      series: [{
        name: 'Producto',
        data: scatter.map((p: any) => ({
          x:    parseFloat(p.price),
          y:    parseInt(p.sold),
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
      colors:     ['#11C267'],
      markers:    { size: 8, strokeWidth: 0, hover: { sizeOffset: 3 } },
      dataLabels: { enabled: false },
      grid:       { borderColor: '#f1f5f9', strokeDashArray: 4 },
      xaxis: {
        title:      { text: 'Precio (€)', style: { color: '#94a3b8', fontSize: '11px' } },
        labels:     {
          style:     { colors: '#94a3b8', fontSize: '10px' },
          formatter: (v: number) => v + '€',
        },
        axisBorder: { show: false },
        axisTicks:  { show: false },
      },
      yaxis: {
        title:  { text: 'Uds. vendidas', style: { color: '#94a3b8', fontSize: '11px' } },
        labels: { style: { colors: '#94a3b8', fontSize: '10px' } },
      },
      tooltip: {
        theme: 'light',
        custom: ({ series, seriesIndex, dataPointIndex, w }: any) => {
          const d    = w.config.series[seriesIndex].data[dataPointIndex];
          const name = d.meta ?? '—';
          return `
            <div style="padding:8px 12px;font-size:12px;font-weight:600;color:#111;border-radius:8px">
              <div style="margin-bottom:4px;font-size:13px">${name}</div>
              <div style="color:#11C267">💰 Precio: ${d.x}€</div>
              <div style="color:#3b82f6">📦 Vendidos: ${d.y} uds.</div>
            </div>`;
        },
      },
    };
  }

  // ── GRÁFICA 6: Barras apiladas por categoría ──────────────────
  private buildStacked(stacked: any[]): void {
    this.stackedEmpty = stacked.length === 0;
    if (this.stackedEmpty) return;

    const stackedMonths = [...new Set(stacked.map((r: any) =>
      this.meses[(r.month ?? 1) - 1] + ' ' + String(r.year).slice(-2),
    ))];
    const categories = [...new Set(stacked.map((r: any) => r.category as string))];
    const catColors  = ['#11C267','#3b82f6','#f97316','#8b5cf6','#f59e0b','#ec4899','#14b8a6'];

    const stackedSeries = categories.map((cat, ci) => ({
      name:  cat,
      color: catColors[ci % catColors.length],
      data:  stackedMonths.map(ml => {
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
      series:  stackedSeries,
      colors:  catColors,
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
      fill:       { opacity: 1 },
      grid:       { borderColor: '#f1f5f9', strokeDashArray: 4, xaxis: { lines: { show: false } } },
      xaxis: {
        categories: stackedMonths,
        labels:     { style: { colors: '#94a3b8', fontSize: '10px' } },
        axisBorder: { show: false },
        axisTicks:  { show: false },
      },
      yaxis: {
        labels: {
          style:     { colors: '#94a3b8', fontSize: '10px' },
          formatter: (v: number) => v.toFixed(0) + '€',
        },
      },
      legend:  { position: 'top', fontSize: '11px', labels: { colors: '#374151' } },
      tooltip: {
        theme: 'light', shared: true, intersect: false,
        y: { formatter: (v: number) => v.toFixed(2) + ' €' },
      },
    };
  }

  // ── Degradado barras por valor ────────────────────────────────
  private getBarColorRanges(orders: number[]): { from: number; to: number; color: string }[] {
    if (!orders.length) return [];
    const max = Math.max(...orders);
    if (max === 0) return [];
    return [
      { from: 0,              to: max * 0.33, color: '#4ade80' },
      { from: max * 0.33 + 1, to: max * 0.66, color: '#22c55e' },
      { from: max * 0.66 + 1, to: max * 2,    color: '#15803d' },
    ];
  }

  // ══════════════════════════════════════════════════════════════
  //  EXPORTAR PDF
  // ══════════════════════════════════════════════════════════════

  async exportPDF(): Promise<void> {
    if (this.exporting) return;
    this.exporting = true;
    this.cdr.detectChanges();

    try {
      const pdf    = new jsPDF('p', 'mm', 'a4');
      const pageW  = pdf.internal.pageSize.getWidth();
      const pageH  = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const useW   = pageW - margin * 2;
      let posY     = margin;

      const addEl = async (id: string) => {
        const el = document.getElementById(id);
        if (!el) return;
        const canvas = await html2canvas(el, {
          scale: 2, backgroundColor: '#ffffff',
          useCORS: true, logging: false,
        });
        const imgData = canvas.toDataURL('image/png');
        const imgH    = (canvas.height * useW) / canvas.width;
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