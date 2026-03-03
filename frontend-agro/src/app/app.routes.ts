import { Routes } from '@angular/router';
import { Login }           from './components/login/login';
import { Register }        from './components/register/register';
import { Dashboard }       from './components/dashboard/dashboard';
import { Catalogo }        from './components/catalogo/catalogo';
import { Favoritos }       from './components/favoritos/favoritos';
import { DetalleProducto } from './components/detalle-producto/detalle-producto';
import { LoginSuccess }    from './components/login-success/login-success';
import { authGuard }       from './core/guards/auth-guard';
import { farmerGuard }     from './core/guards/farmer-guard';

export const routes: Routes = [
  { path: '',               component: Dashboard },
  { path: 'login',          component: Login },
  { path: 'registro',       component: Register },
  { path: 'login-success',  component: LoginSuccess },
  { path: 'productos',      component: Catalogo },
  { path: 'producto/:id',   component: DetalleProducto },

  // Solo usuarios logueados
  { path: 'productos/favoritos', component: Favoritos, canActivate: [authGuard] },

  // Solo agricultores
  {
    path: 'agricultor',
    canActivate: [farmerGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./agricultor/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'mis-productos',
        loadComponent: () => import('./agricultor/mis-productos/mis-productos').then(m => m.MisProductos)
      },
      {
        path: 'pedidos',
        loadComponent: () => import('./agricultor/pedidos/pedidos').then(m => m.Pedidos)
      },
      {
        path: 'estadisticas',
        loadComponent: () => import('./agricultor/estadisticas/estadisticas').then(m => m.Estadisticas)
      },
      {
        path: 'mensajes',
        loadComponent: () => import('./agricultor/mensajes/mensajes').then(m => m.Mensajes)
      },
      {
        path: 'configuracion',
        loadComponent: () => import('./agricultor/configuracion/configuracion').then(m => m.Configuracion)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: '' }
];
