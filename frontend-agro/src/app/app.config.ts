import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';

import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

registerLocaleData(localeEs, 'es');

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withFetch(), 
      withInterceptors([authInterceptor]),
    ),
    { provide: LOCALE_ID, useValue: 'es' }
  ]
};