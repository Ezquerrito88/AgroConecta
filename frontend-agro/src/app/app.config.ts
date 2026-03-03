import { ApplicationConfig, LOCALE_ID } from '@angular/core'; // 👈 1. Importa LOCALE_ID
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

registerLocaleData(localeEs, 'es');

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    
    // 👇 2. AÑADE ESTA LÍNEA PARA ACTIVARLO
    { provide: LOCALE_ID, useValue: 'es' }
  ]
};