import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css'
})
export class AdminLayout {
  private auth   = inject(AuthService);
  private router = inject(Router);

  user = this.auth.getCurrentUser();
  sidebarCollapsed = signal(false);

  navItems = [
    { label: 'Inicio',     icon: 'home',      route: '/admin/dashboard'    },
    { label: 'Usuarios',    icon: 'group',         route: '/admin/usuarios'   },
    { label: 'Productos',   icon: 'inventory_2',   route: '/admin/productos'  },
    { label: 'Categorías',  icon: 'category',      route: '/admin/categorias' },
    
  ];

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}