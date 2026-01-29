import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  
  // 1. CAMBIO IMPORTANTE: Usamos 'auth_token' para que coincida con tu App.ts
  const token = localStorage.getItem('auth_token'); 

  // 2. Si hay token, lo inyectamos
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  // 3. Si no, dejamos pasar
  return next(req);
};