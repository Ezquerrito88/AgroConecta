import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const buyerGuard: CanActivateFn = () => {
  const router = inject(Router);
  const raw = localStorage.getItem('user');
  if (!raw) { router.navigate(['/login']); return false; }

  const role = JSON.parse(raw)?.role?.toLowerCase();
  const allowed = ['comprador', 'buyer', 'user'];

  if (allowed.includes(role)) return true;

  router.navigate(['/']);
  return false;
};
