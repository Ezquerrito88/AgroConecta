import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { farmerGuard } from './core/guards/farmer-guard';
import { buyerGuard } from './core/guards/buyer-guard-guard';
import { adminGuard } from './admin/guards/admin-guard';

export const routes: Routes = [
  // Rutas públicas con lazy loading
  {
    path: '',
    loadComponent: () => import('./components/dashboard/dashboard').then(m => m.Dashboard)
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then(m => m.Login)
  },
  {
    path: 'registro',
    loadComponent: () => import('./components/register/register').then(m => m.Register)
  },
  {
    path: 'login-success',
    loadComponent: () => import('./components/login-success/login-success').then(m => m.LoginSuccess)
  },
  {
    path: 'productos',
    loadComponent: () => import('./components/catalogo/catalogo').then(m => m.Catalogo)
  },
  {
    path: 'producto/:id',
    loadComponent: () => import('./components/detalle-producto/detalle-producto').then(m => m.DetalleProducto)
  },

  // Solo usuarios logueados
  {
    path: 'productos/favoritos',
    loadComponent: () => import('./components/favoritos/favoritos').then(m => m.Favoritos),
    canActivate: [authGuard]
  },
  {
    path: 'cesta',
    loadComponent: () => import('./components/cesta/cesta').then(m => m.Cesta),
    canActivate: [authGuard]
  },
  {
    path: 'checkout',
    loadComponent: () => import('./components/checkout/checkout').then(m => m.Checkout),
    canActivate: [authGuard]
  },
  {
    path: 'checkout/confirmacion',
    loadComponent: () => import('./components/checkout-confirmation/checkout-confirmation').then(m => m.CheckoutConfirmation),
    canActivate: [authGuard]
  },

  // Solo agricultores
  {
    path: 'agricultor',
    canActivate: [farmerGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./agricultor/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'mis-productos', loadComponent: () => import('./agricultor/mis-productos/mis-productos').then(m => m.MisProductos) },
      { path: 'mis-productos/nuevo', loadComponent: () => import('./agricultor/nuevo-producto/nuevo-producto').then(m => m.NuevoProducto) },
      { path: 'mis-productos/editar/:id', loadComponent: () => import('./agricultor/editar-producto/editar-producto').then(m => m.EditarProducto) },
      { path: 'pedidos', loadComponent: () => import('./agricultor/pedidos/pedidos').then(m => m.Pedidos) },
      { path: 'estadisticas', loadComponent: () => import('./agricultor/estadisticas/estadisticas').then(m => m.Estadisticas) },
      { path: 'mensajes', loadComponent: () => import('./agricultor/mensajes/mensajes').then(m => m.Mensajes) },
      { path: 'configuracion', loadComponent: () => import('./agricultor/configuracion/configuracion').then(m => m.Configuracion) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Solo compradores
  {
    path: 'comprador',
    canActivate: [buyerGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./comprador/buyer-dashboard/buyer-dashboard').then(m => m.BuyerDashboard) },
      { path: 'mis-pedidos', loadComponent: () => import('./comprador/mis-pedidos/mis-pedidos').then(m => m.MisPedidos) },
      { path: 'favoritos', loadComponent: () => import('./comprador/favoritos/favoritos').then(m => m.Favoritos) },
      { path: 'configuracion', loadComponent: () => import('./comprador/configuracion/configuracion').then(m => m.Configuracion) },
      { path: 'mensajes', loadComponent: () => import('./comprador/mensajes/mensajes').then(m => m.Mensajes) },
      { path: 'valoraciones', loadComponent: () => import('./comprador/valoraciones/valoraciones').then(m => m.Valoraciones) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Solo admin
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadChildren: () => import('./admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },

  { path: '**', redirectTo: '' }
];