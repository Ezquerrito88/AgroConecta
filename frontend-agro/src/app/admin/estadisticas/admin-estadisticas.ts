import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { AdminStatsService } from '../guards/admin-stats.service';
import {
  NgApexchartsModule,
  ApexChart, ApexAxisChartSeries, ApexXAxis,
  ApexStroke, ApexFill, ApexTooltip, ApexGrid,
  ApexPlotOptions, ApexDataLabels
} from 'ng-apexcharts';
import { environment } from '../../../environments/environment';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-admin-estadisticas',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyPipe, NgApexchartsModule],
  templateUrl: './admin-estadisticas.html',
  styleUrls: ['./admin-estadisticas.css']
})
export class AdminEstadisticas implements OnInit {

  user: any      = null;
  dashboard: any = null;
  loading        = true;
  error          = false;
  exporting      = false;

  today          = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  mesActualLabel = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  meses          = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  /* ── Paletas de colores para avatares e imágenes fallback ── */
  private readonly AVATAR_BG_COLORS  = ['#dbeafe','#e0e7ff','#ede9fe','#bfdbfe','#c7d2fe'];
  private readonly AVATAR_TEXT_COLORS = ['#1d4ed8','#4338ca','#7c3aed','#0369a1','#4f46e5'];
  private readonly FALLBACK_COLORS    = ['#3b82f6','#6366f1','#8b5cf6','#0ea5e9','#2563eb'];

  /* ── Chart options ── */
  areaOptions: {
    series: ApexAxisChartSeries; chart: ApexChart; xaxis: ApexXAxis;
    stroke: ApexStroke; fill: ApexFill; tooltip: ApexTooltip;
    grid: ApexGrid; dataLabels: ApexDataLabels;
  } = {
    series:     [{ name: 'Ingresos', data: [] }],
    chart: {
      type: 'area', height: 240,
      toolbar: { show: false },
      background: 'transparent',
      fontFamily: 'Inter, sans-serif',
      animations: { enabled: true, speed: 600, dynamicAnimation: { enabled: true, speed: 350 } },
    },
    stroke:     { curve: 'smooth', width: 2.5 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.02,
        colorStops: [
          { offset: 0,   color: '#3b82f6', opacity: 0.3 },
          { offset: 100, color: '#3b82f6', opacity: 0.02 },
        ]
      }
    },
    dataLabels: { enabled: false },
    grid:       {
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      padding: { left: 4, right: 4 }
    },
    xaxis: {
      categories: [],
      labels: { style: { colors: '#94a3b8', fontSize: '11px', fontFamily: 'Inter, sans-serif' } },
      axisBorder: { show: false },
      axisTicks:  { show: false }
    },
    tooltip: {
      theme: 'light',
      y: { formatter: (v: number) => v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €' }
    },
  };

  barOptions: {
    series: ApexAxisChartSeries; chart: ApexChart; xaxis: ApexXAxis;
    plotOptions: ApexPlotOptions; dataLabels: ApexDataLabels;
    grid: ApexGrid; tooltip: ApexTooltip; fill: ApexFill;
  } = {
    series:      [{ name: 'Pedidos', data: [] }],
    chart: {
      type: 'bar', height: 240,
      toolbar: { show: false },
      background: 'transparent',
      fontFamily: 'Inter, sans-serif',
      animations: { enabled: true, speed: 600, dynamicAnimation: { enabled: true, speed: 350 } },
    },
    plotOptions: { bar: { borderRadius: 6, columnWidth: '50%' } },
    dataLabels:  { enabled: false },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light', type: 'vertical', shadeIntensity: 0.2,
        opacityFrom: 1, opacityTo: 0.75,
        colorStops: [
          { offset: 0,   color: '#6366f1', opacity: 1 },
          { offset: 100, color: '#818cf8', opacity: 0.8 },
        ]
      }
    },
    grid: {
      borderColor: '#f1f5f9',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      padding: { left: 4, right: 4 }
    },
    xaxis: {
      categories: [],
      labels: { style: { colors: '#94a3b8', fontSize: '11px', fontFamily: 'Inter, sans-serif' } },
      axisBorder: { show: false },
      axisTicks:  { show: false }
    },
    tooltip: {
      theme: 'light',
      y: { formatter: (v: number) => v + ' pedidos' }
    },
  };

  constructor(
    private adminStatsService: AdminStatsService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.error   = false;
    this.adminStatsService.getAdminDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        try { this.buildCharts(data); } catch (e) { console.error('buildCharts error:', e); }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('loadStats error:', err);
        this.error   = true;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private buildCharts(data: any): void {
    const monthly: any[] = data.monthly_revenue ?? [];
    // Ordenar por mes ascendente por si el backend no los devuelve ordenados
    const sorted  = [...monthly].sort((a, b) => (a.month ?? 0) - (b.month ?? 0));
    const labels  = sorted.map((m: any) => this.meses[(m.month ?? 1) - 1]);
    const revenue = sorted.map((m: any) => parseFloat(m.total ?? 0));
    const orders  = sorted.map((m: any) => parseInt(m.orders_count ?? 0, 10));

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
  }

  /* ── Imagen de producto ── */
  getProductImage(p: any): string {
    if (!p) return this.getFallbackSvg('?');
    const fromImages = p.images?.[0]?.url;
    if (fromImages) return fromImages;
    if (p.image) {
      return p.image.startsWith('http')
        ? p.image
        : `${environment.apiUrl}/storage/${p.image}`;
    }
    return this.getFallbackSvg(p.name ?? '?');
  }

  onImgError(event: Event, name: string): void {
    const img   = event.target as HTMLImageElement;
    img.src     = this.getFallbackSvg(name);
    img.onerror = null; // evita bucle infinito
  }

  getFallbackSvg(name: string): string {
    const letter = (name?.charAt(0)?.toUpperCase()) ?? '?';
    const idx    = (name?.charCodeAt(0) ?? 0) % this.FALLBACK_COLORS.length;
    const color  = this.FALLBACK_COLORS[idx];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44">
      <rect width="44" height="44" rx="10" fill="${color}22"/>
      <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
        font-family="sans-serif" font-size="18" font-weight="600" fill="${color}">${letter}</text>
    </svg>`;
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  }

  /* ── Avatar de agricultor ── */
  getAvatarColor(name: string): string {
    const idx = (name?.length ?? 0) % this.AVATAR_BG_COLORS.length;
    return this.AVATAR_BG_COLORS[idx];
  }

  // FIX: el original usaba colores muy claros para el texto (mismo que el fondo)
  // Ahora se expone este método para usar en el template con [style.color]
  getAvatarTextColor(name: string): string {
    const idx = (name?.length ?? 0) % this.AVATAR_TEXT_COLORS.length;
    return this.AVATAR_TEXT_COLORS[idx];
  }

  /* ── Barra de progreso ── */
  getBarWidth(val: number, list: any[], key: string): number {
    if (!list?.length) return 0;
    const max = Math.max(...list.map((p: any) => Number(p[key] ?? 0)), 1);
    return Math.round((val / max) * 100);
  }

  /* ── Export PDF ── */
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

      const addElement = async (el: HTMLElement | null): Promise<void> => {
        if (!el) return;
        const canvas  = await html2canvas(el, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false,  // silencia warnings de html2canvas en consola
        });
        const imgData = canvas.toDataURL('image/png');
        const imgH    = (canvas.height * usableW) / canvas.width;
        if (posY + imgH > pageH - margin) {
          pdf.addPage();
          posY = margin;
        }
        pdf.addImage(imgData, 'PNG', margin, posY, usableW, imgH);
        posY += imgH + 6;
      };

      await addElement(document.getElementById('pdf-header'));
      await addElement(document.querySelector<HTMLElement>('.charts-row .section-card:nth-child(1)'));
      await addElement(document.querySelector<HTMLElement>('.charts-row .section-card:nth-child(2)'));
      await addElement(document.getElementById('pdf-top-products'));
      await addElement(document.getElementById('pdf-top-farmers'));

      const fecha = new Date().toISOString().slice(0, 10);
      pdf.save(`agroconecta-stats-${fecha}.pdf`);

    } catch (err) {
      console.error('exportPDF error:', err);
    } finally {
      this.exporting = false;
      this.cdr.detectChanges();
    }
  }

  openSidebar(): void {
    document.dispatchEvent(new CustomEvent('open-admin-sidebar'));
  }
}