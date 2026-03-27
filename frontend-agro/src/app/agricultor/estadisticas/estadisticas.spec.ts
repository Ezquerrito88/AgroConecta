import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Estadisticas } from './estadisticas';
import { DashboardService, StatisticsData } from '../../core/services/dashboard';
import { AuthService } from '../../core/services/auth';

const mockStats: StatisticsData = {
  summary: { total_revenue: 1200, total_orders: 30, total_products: 5, avg_rating: 4.2, total_reviews: 12 },
  monthly_revenue: [
    { month: 'oct', year: 2024, revenue: 200, orders: 5 },
    { month: 'nov', year: 2024, revenue: 400, orders: 10 },
    { month: 'dic', year: 2024, revenue: 300, orders: 8 },
    { month: 'ene', year: 2025, revenue: 100, orders: 3 },
    { month: 'feb', year: 2025, revenue: 150, orders: 4 },
    { month: 'mar', year: 2025, revenue: 50,  orders: 2 },
  ],
  orders_by_status: [
    { status: 'delivered', count: 20 },
    { status: 'pending',   count: 7  },
    { status: 'cancelled', count: 3  },
  ],
  top_products: [
    { id: 1, name: 'Tomates',   image: null, sold: 50, revenue: 500, rating: 4.5, unit: 'kg' },
    { id: 2, name: 'Pimientos', image: null, sold: 30, revenue: 300, rating: 4.0, unit: 'kg' },
  ],
};

describe('Estadisticas', () => {
  let component: Estadisticas;
  let fixture: ComponentFixture<Estadisticas>;

  beforeEach(async () => {
    const mockDashboardService = { getStatistics: vi.fn(() => of(mockStats)) };
    const mockAuthService      = { getCurrentUser: vi.fn(() => ({ name: 'Test Farmer' })) };

    await TestBed.configureTestingModule({
      imports: [Estadisticas],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: DashboardService, useValue: mockDashboardService },
        { provide: AuthService,      useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(Estadisticas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load statistics data on init', () => {
    expect(component.summary.total_orders).toBe(30);
    expect(component.monthlyRevenue.length).toBe(6);
    expect(component.ordersByStatus.length).toBe(3);
    expect(component.topProducts.length).toBe(2);
  });

  it('should compute barHeight proportionally', () => {
    component.monthlyRevenue = mockStats.monthly_revenue;
    expect(component.barHeight(400)).toBe(100);
    expect(component.barHeight(200)).toBe(50);
    expect(component.barHeight(0)).toBe(0);
  });

  it('should compute statusPercent proportionally', () => {
    component.ordersByStatus = mockStats.orders_by_status;
    expect(component.statusPercent(30)).toBe(100);
    expect(component.statusPercent(15)).toBe(50);
  });

  it('should return placeholder for null product image', () => {
    expect(component.getProductImage(mockStats.top_products[0])).toBe('assets/img/placeholder.jpg');
  });

  it('should return translated status label', () => {
    expect(component.getStatusLabel('delivered')).toBe('Entregado');
    expect(component.getStatusLabel('unknown')).toBe('unknown');
  });

  it('should set hasError flag when API fails', () => {
    const mockSvc = { getStatistics: vi.fn(() => throwError(() => new Error('fail'))) };
    (component as any)['dashboardService'] = mockSvc;
    component.loadStatistics();
    expect(component.hasError).toBeTruthy();
    expect(component.isLoading).toBeFalsy();
  });
});
