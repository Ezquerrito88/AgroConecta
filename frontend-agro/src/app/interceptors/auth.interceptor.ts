import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  
  // 1. Obtenemos el token
  const token = localStorage.getItem('auth_token'); 

  // 2. Definimos la URL
  const isApiUrl = req.url.startsWith(environment.apiUrl) || req.url.includes('127.0.0.1:8000');

  // 3. Si tenemos token y la petición va a nuestra API
  if (token && isApiUrl) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    console.log('Interceptor: Inyectando token en la petición a:', req.url);
    return next(cloned);
  }

  // 4. Si no hay token dejamos pasar la petición original
  return next(req);
};