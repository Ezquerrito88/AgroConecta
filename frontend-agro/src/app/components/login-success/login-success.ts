import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-login-success',
  standalone: true,
  template: '<p>Procesando inicio de sesión...</p>' // Mensaje temporal mientras redirige
})
export class LoginSuccess implements OnInit {
  private readonly PENDING_CHECKOUT_KEY = 'pending_checkout';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
  this.route.queryParams.subscribe(params => {
    const token = params['token'];
    const userStr = params['user'];
    const redirectTo = params['redirectTo'];

    if (token && userStr) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', userStr);

      const hasPendingCheckout = sessionStorage.getItem(this.PENDING_CHECKOUT_KEY) === '1';
      if (hasPendingCheckout) {
        this.router.navigate(['/checkout']);
        return;
      }

      if (redirectTo) {
        this.router.navigateByUrl(redirectTo);
        return;
      }

      this.router.navigate(['/']); 
      
    } else {
      this.router.navigate(['/login']);
    }
  });
  }
}