import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { Dashboard } from './components/dashboard/dashboard';
import { Catalogo } from './components/catalogo/catalogo';
import { Favoritos } from './components/favoritos/favoritos';
import { DetalleProducto } from './components/detalle-producto/detalle-producto';
import { LoginSuccess } from './components/login-success/login-success';
import { Cesta } from './components/cesta/cesta';
import { Checkout } from './components/checkout/checkout';
import { CheckoutConfirmation } from './components/checkout-confirmation/checkout-confirmation';
import { authGuard } from './core/guards/auth-guard';
import { farmerGuard } from './core/guards/farmer-guard';
import { buyerGuard } from './core/guards/buyer-guard-guard';

export const routes: Routes = [
  { path: '', component: Dashboard },
  { path: 'login', component: Login },
  { path: 'registro', component: Register },
  { path: 'login-success', component: LoginSuccess },
  { path: 'productos', component: Catalogo },
  { path: 'producto/:id', component: DetalleProducto },

  // Solo usuarios logueados
  { path: 'productos/favoritos', component: Favoritos, canActivate: [authGuard] },
  { path: 'cesta', component: Cesta, canActivate: [authGuard] },
  { path: 'checkout', component: Checkout, canActivate: [authGuard] },
  { path: 'checkout/confirmacion', component: CheckoutConfirmation, canActivate: [authGuard] },

  // Solo agricultores
  {
    path: 'agricultor',
    canActivate: [farmerGuard],
    children: [
      { path: 'dashboard',        loadComponent: () => import('./agricultor/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'mis-productos',    loadComponent: () => import('./agricultor/mis-productos/mis-productos').then(m => m.MisProductos) },
      { path: 'mis-productos/nuevo', loadComponent: () => import('./agricultor/nuevo-producto/nuevo-producto').then(m => m.NuevoProducto) },
      { path: 'mis-productos/editar/:id', loadComponent: () => import('./agricultor/editar-producto/editar-producto').then(m => m.EditarProducto) },
      { path: 'pedidos',          loadComponent: () => import('./agricultor/pedidos/pedidos').then(m => m.Pedidos) },
      { path: 'estadisticas',     loadComponent: () => import('./agricultor/estadisticas/estadisticas').then(m => m.Estadisticas) },
      { path: 'mensajes',         loadComponent: () => import('./agricultor/mensajes/mensajes').then(m => m.Mensajes) },
      { path: 'configuracion',    loadComponent: () => import('./agricultor/configuracion/configuracion').then(m => m.Configuracion) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Solo compradores
  {
    path: 'comprador',
    canActivate: [buyerGuard],
    children: [
      { path: 'dashboard',     loadComponent: () => import('./comprador/buyer-dashboard/buyer-dashboard').then(m => m.BuyerDashboard) },
      { path: 'mis-pedidos',   loadComponent: () => import('./comprador/mis-pedidos/mis-pedidos').then(m => m.MisPedidos) },
      { path: 'favoritos',     loadComponent: () => import('./comprador/favoritos/favoritos').then(m => m.Favoritos) },
      { path: 'configuracion', loadComponent: () => import('./comprador/configuracion/configuracion').then(m => m.Configuracion) },
      { path: 'mensajes',      loadComponent: () => import('./comprador/mensajes/mensajes').then(m => m.Mensajes) },
      { path: 'valoraciones',  loadComponent: () => import('./comprador/valoraciones/valoraciones').then(m => m.Valoraciones) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: '' }
];
