import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const farmerGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token  = localStorage.getItem('token');
  const user   = JSON.parse(localStorage.getItem('user') ?? 'null');
  const role   = user?.role?.toLowerCase();

  if (!token || !user) {
    router.navigate(['/login']);
    return false;
  }

  if (role !== 'agricultor' && role !== 'farmer') {
    router.navigate(['/']);
    return false;
  }

  return true;
};
