import { Routes } from '@angular/router';
import { Login } from './components/login/login'; // Asegúrate de que la ruta es correcta

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];