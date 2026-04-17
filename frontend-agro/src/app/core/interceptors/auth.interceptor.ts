import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const isApiUrl = req.url.startsWith(environment.apiUrl) || req.url.includes('127.0.0.1:8000');
  
  if (token && isApiUrl) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    return next(cloned);
  }

  return next(req);
};