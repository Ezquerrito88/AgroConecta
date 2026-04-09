import { Routes } from '@angular/router';
import { AdminLayout } from './layout/admin-layout/admin-layout';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayout,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./sistema/admin-dashboard/dashboard').then(
            m => m.AdminDashboard
          )
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./usuarios/gestion-usuarios/gestion-usuarios').then(
            m => m.GestionUsuarios
          )
      },
      {
        path: 'productos',
        loadComponent: () =>
          import('./productos/gestion-productos/gestion-productos').then(
            m => m.GestionProductos
          )
      },
      {
        path: 'productos/:id/editar',
        loadComponent: () =>
          import('./editar-producto/editar-producto').then(
            m => m.EditarProducto
          )
      },
      {
        path: 'categorias',
        loadComponent: () =>
          import('./categorias/gestion-categorias/gestion-categorias').then(
            m => m.GestionCategorias
          )
      }
    ]
  }
];