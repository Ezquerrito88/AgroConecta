import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Dashboard } from './components/dashboard/dashboard';
import { Catalogo } from './components/catalogo/catalogo';

export const routes: Routes = [
  { path: '', component: Dashboard }, // Esta es tu landing page
  { path: 'login', component: Login },
  { path: 'productos', component: Catalogo },
  { path: '**', redirectTo: '' },

];