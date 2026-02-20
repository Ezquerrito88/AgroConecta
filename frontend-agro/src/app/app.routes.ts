import { Routes } from '@angular/router';
import { Login }          from './components/login/login';
import { Register }       from './components/register/register';
import { Dashboard }      from './components/dashboard/dashboard';
import { Catalogo }       from './components/catalogo/catalogo';
import { Favoritos }      from './components/favoritos/favoritos';
import { DetalleProducto } from './components/detalle-producto/detalle-producto';
import { LoginSuccess }   from './components/login-success/login-success';
import { authGuard }      from './guards/auth-guard';
import { farmerGuard }    from './guards/farmer-guard';

export const routes: Routes = [
  { path: '',                  component: Dashboard },
  { path: 'login',             component: Login },
  { path: 'registro',          component: Register },
  { path: 'login-success',     component: LoginSuccess },
  { path: 'productos',         component: Catalogo },
  { path: 'producto/:id',      component: DetalleProducto },

  // Solo usuarios logueados
  { path: 'productos/favoritos', component: Favoritos, canActivate: [authGuard] },

  // Solo agricultores
  {
    path: 'mis-productos',
    canActivate: [farmerGuard],
    // CORRECCIÓN AQUÍ: Cambiado m.MisProductos por m.MisProductosComponent
    loadComponent: () => import('./components/farmer/mis-productos/mis-productos').then(m => m.MisProductos)
  },
  {
    path: 'mis-productos/crear',
    canActivate: [farmerGuard],
    loadComponent: () => import('./components/farmer/crear-producto/crear-producto').then(m => m.CrearProducto)
  },

  { path: '**', redirectTo: '' }
];