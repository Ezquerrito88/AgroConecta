import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { Sidebar } from '../sidebar/sidebar';
import { StatsService } from '../../core/services/stats.service';
import {
  NgApexchartsModule,
  ApexChart, ApexAxisChartSeries, ApexXAxis,
  ApexStroke, ApexFill, ApexTooltip, ApexGrid,
  ApexPlotOptions, ApexDataLabels, ApexLegend,
  ApexNonAxisChartSeries, ApexResponsive
} from 'ng-apexcharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyPipe, DecimalPipe, NgApexchartsModule, Sidebar],
  templateUrl: './estadisticas.html',
  styleUrls: ['./estadisticas.css']
})
export class Estadisticas implements OnInit {

  user: any = null;
  dashboard: any = null;
  loading = true;
  error = false;
  exporting = false;

  today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  mesActualLabel = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

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

  // ── Área: ingresos mensuales ──────────────────────
  areaOptions: {
    series: ApexAxisChartSeries; chart: ApexChart; xaxis: ApexXAxis;
    stroke: ApexStroke; fill: ApexFill; tooltip: ApexTooltip;
    grid: ApexGrid; dataLabels: ApexDataLabels;
  } = {
    series: [{ name: 'Ingresos', data: [] }],
    chart: {
      type: 'area', height: 220, toolbar: { show: false }, background: 'transparent',
      animations: { enabled: true, speed: 600, dynamicAnimation: { enabled: true, speed: 350 } },
    },
    stroke:     { curve: 'smooth', width: 2 },
    fill:       { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.02 } },
    dataLabels: { enabled: false },
    grid:       { borderColor: '#f1f5f9', strokeDashArray: 4, xaxis: { lines: { show: false } } },
    xaxis:      { categories: [], labels: { style: { colors: '#94a3b8', fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
    tooltip:    { theme: 'light', y: { formatter: (v) => v.toFixed(2) + ' €' } },
  };

  // ── Barras: pedidos por mes ───────────────────────
  barOptions: {
    series: ApexAxisChartSeries; chart: ApexChart; xaxis: ApexXAxis;
    plotOptions: ApexPlotOptions; dataLabels: ApexDataLabels;
    grid: ApexGrid; tooltip: ApexTooltip; fill: ApexFill;
  } = {
    series: [{ name: 'Pedidos', data: [] }],
    chart: {
      type: 'bar', height: 220, toolbar: { show: false }, background: 'transparent',
      animations: { enabled: true, speed: 600, dynamicAnimation: { enabled: true, speed: 350 } },
    },
    plotOptions: { bar: { borderRadius: 5, columnWidth: '50%' } },
    dataLabels:  { enabled: false },
    grid:        { borderColor: '#f1f5f9', strokeDashArray: 4, xaxis: { lines: { show: false } } },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light', type: 'vertical', shadeIntensity: 0.2,
        gradientToColors: ['#4ade80'], opacityFrom: 1, opacityTo: 0.75,
      },
    },
    xaxis:   { categories: [], labels: { style: { colors: '#94a3b8', fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
    tooltip: { theme: 'light', y: { formatter: (v) => v + ' pedidos' } },
  };

  // ── Dona: pedidos por estado ──────────────────────
  donutOptions: {
    series: ApexNonAxisChartSeries; chart: ApexChart; labels: string[];
    colors: string[]; legend: ApexLegend; dataLabels: ApexDataLabels;
    plotOptions: ApexPlotOptions; responsive: ApexResponsive[]; tooltip: ApexTooltip;
  } = {
    series: [],
    chart: {
      type: 'donut', height: 200, background: 'transparent',
      animations: { enabled: true, speed: 600, dynamicAnimation: { enabled: true, speed: 350 } },
    },
    labels:      [],
    colors:      [],
    legend:      { show: false },
    dataLabels:  { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: (w) => w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0),
            },
          },
        },
      },
    },
    responsive: [{ breakpoint: 480, options: { chart: { height: 180 } } }],
    tooltip:    { theme: 'light' },
  };

  constructor(
    private statsService: StatsService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.error = false;
    this.statsService.getFarmerStats().subscribe({
      next: (data) => {
        this.dashboard = data;
        try { this.buildCharts(data); } catch (e) { console.error(e); }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = true;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private buildCharts(data: any): void {
    const monthly: any[] = data.monthly_revenue ?? [];
    const labels  = monthly.map((m: any) => this.meses[(m.month ?? 1) - 1]);
    const revenue = monthly.map((m: any) => parseFloat(m.total ?? 0));
    const orders  = monthly.map((m: any) => parseInt(m.orders_count ?? 0));

    this.areaOptions = {
      ...this.areaOptions,
      series: [{ name: 'Ingresos', data: revenue }],
      xaxis:  { ...this.areaOptions.xaxis, categories: labels },
    };

    this.barOptions = {
      ...this.barOptions,
      series: [{ name: 'Pedidos', data: orders }],
      xaxis:  { ...this.barOptions.xaxis, categories: labels },
    };

    // Colores mapeados por significado semántico
    const statuses: any[] = data.orders_by_status ?? [];
    this.donutOptions = {
      ...this.donutOptions,
      series: statuses.map((s: any) => s.count),
      labels: statuses.map((s: any) => this.statusLabels[s.status] ?? s.status),
      colors: statuses.map((s: any) => this.statusColors[s.status] ?? '#94a3b8'),
    };
  }

  getStatusLabel(status: string): string {
    return this.statusLabels[status] ?? status;
  }

  getAvatarColor(name: string): string {
    const colors = ['#dcfce7', '#dbeafe', '#fef9c3', '#f3e8ff', '#ffedd5'];
    return colors[(name?.length || 0) % colors.length];
  }

  getStarsArray(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating));
  }

  getBarWidth(sold: number): number {
    const max = Math.max(...(this.dashboard?.top_products ?? []).map((p: any) => p.sold ?? 0), 1);
    return (sold / max) * 100;
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

      // Espera a que ApexCharts termine de renderizar
      await new Promise(r => setTimeout(r, 500));

      await addElement(document.getElementById('pdf-farmer-header'));
      await addElement(document.getElementById('pdf-chart-ingresos'));
      await addElement(document.getElementById('pdf-chart-dona'));
      await addElement(document.getElementById('pdf-chart-pedidos'));
      await addElement(document.getElementById('pdf-top-products'));
      await addElement(document.getElementById('pdf-recent-orders'));

      pdf.save(`agroconecta-informe-${new Date().toISOString().slice(0, 10)}.pdf`);

    } finally {
      this.exporting = false;
      this.cdr.detectChanges();
    }
  }
}