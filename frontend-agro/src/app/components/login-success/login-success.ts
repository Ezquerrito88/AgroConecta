import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-login-success',
  standalone: true,
  template: `
    <div style="text-align: center; margin-top: 50px; font-family: sans-serif;">
      <p>Sincronizando cuenta con AgroConecta...</p>
      <div class="spinner"></div>
    </div>
  `
})
export class LoginSuccess implements OnInit {
  private readonly PENDING_CHECKOUT_KEY = 'pending_checkout';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const dataEncoded = params['data']; // Laravel envía 'data', no 'user'
      const redirectTo = params['redirectTo'];

      if (token && dataEncoded) {
        try {
          // 1. Decodificar el Base64 y parsear el JSON
          const userObj = JSON.parse(atob(dataEncoded));

          // 2. Guardar en localStorage (igual que en tu Login manual)
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(userObj));

          // 3. Lógica de redirección prioritaria (Checkout)
          const hasPendingCheckout = sessionStorage.getItem(this.PENDING_CHECKOUT_KEY) === '1';
          if (hasPendingCheckout) {
            sessionStorage.removeItem(this.PENDING_CHECKOUT_KEY); // Limpiamos
            this.router.navigate(['/checkout']);
            return;
          }

          // 4. Redirección por parámetro manual
          if (redirectTo) {
            this.router.navigateByUrl(redirectTo);
            return;
          }

          // 5. Redirección automática por ROL
          if (userObj.role === 'farmer') {
            this.router.navigate(['/agricultor/dashboard']);
          } else {
            this.router.navigate(['/']);
          }

        } catch (e) {
          console.error('Error procesando datos de Google:', e);
          this.router.navigate(['/login'], { queryParams: { error: 'data_error' } });
        }
      } else {
        // Si faltan parámetros, regresamos al login
        this.router.navigate(['/login']);
      }
    });
  }
}