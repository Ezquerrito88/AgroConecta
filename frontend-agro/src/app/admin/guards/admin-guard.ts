import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';

export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  const user = auth.getCurrentUser();

  if (user && user.role === 'admin') {
    return true;
  }

  router.navigate(['/login']);
  return false;
};