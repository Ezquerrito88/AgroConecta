import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-dashboard-agricultor',
  standalone: true,
  imports: [CommonModule, RouterModule, CurrencyPipe, Sidebar],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
  user: any = null;
  kpis = { pedidos: 24, ventas: 12500, agotados: 6, calificacion: 4.8 };

  recentOrders = [
    { client: 'Ana María Lopez',  avatar: 'https://i.pravatar.cc/32?img=1', code: 'ORD-7829', date: 'Hoy, 10:25 AM', total: 29000, status: 'pendiente',  statusLabel: 'Pendiente'  },
    { client: 'Carlos Rodríguez', avatar: 'https://i.pravatar.cc/32?img=2', code: 'ORD-7828', date: 'Hoy, 9:15 AM',  total: 18000, status: 'procesando', statusLabel: 'Procesando' },
    { client: 'Laura Martínez',   avatar: 'https://i.pravatar.cc/32?img=3', code: 'ORD-7827', date: 'Ayer, 4:30 PM', total: 19000, status: 'enviado',    statusLabel: 'Enviado'    },
  ];

  topProducts = [
    { name: 'Plátano de Canarias', price: 5.12, rating: 4.5, sold: 130, image: 'https://placehold.co/56x56/f0fdf4/16a34a?text=🍌' },
    { name: 'Tomates Cherry',      price: 4.50, rating: 4.5, sold: 125, image: 'https://placehold.co/56x56/fef2f2/dc2626?text=🍅' },
    { name: 'Cebolla Blanca',      price: 1.50, rating: 4.5, sold: 90,  image: 'https://placehold.co/56x56/fefce8/ca8a04?text=🧅' },
  ];

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
  }
}
