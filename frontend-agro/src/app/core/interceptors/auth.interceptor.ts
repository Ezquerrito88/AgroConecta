import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  
  const token = localStorage.getItem('token'); 

  const isApiUrl = req.url.startsWith(environment.apiUrl) || req.url.includes('127.0.0.1:8000');

  // Rutas públicas — no inyectar token aunque haya sesión activa
  const rutasPublicas = ['/products/latest', '/products/featured', '/categories', '/health'];
  const esPublica = rutasPublicas.some(ruta => req.url.includes(ruta));

  if (token && isApiUrl && !esPublica) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    console.log('Interceptor: Inyectando token en la petición a:', req.url);
    return next(cloned);
  }

  return next(req);
};
