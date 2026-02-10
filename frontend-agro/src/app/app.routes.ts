import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { Dashboard } from './components/dashboard/dashboard';
import { Catalogo } from './components/catalogo/catalogo';
import { Favoritos } from './components/favoritos/favoritos';
import { DetalleProducto } from './components/detalle-producto/detalle-producto';

export const routes: Routes = [
  { path: '', component: Dashboard }, // Esta es tu landing page
  { path: 'login', component: Login },
  { path: 'productos', component: Catalogo },
  { path: 'productos/favoritos', component: Favoritos},
  { path: 'producto/:id', component: DetalleProducto },
  { path: 'registro', component: Register },

];