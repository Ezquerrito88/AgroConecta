import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login-success',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="text-align: center; margin-top: 50px; font-family: sans-serif;">
      <h1>Procesando acceso de Google...</h1>
      <p>Espera un momento, estamos configurando tu perfil de <strong>{{role}}</strong>.</p>
      <div class="spinner"></div> </div>
  `
})
export class LoginSuccess implements OnInit {
  role: string = '';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      this.role = params['role'];

      if (token) {
        console.log('Token recibido correctamente:', token);
        
        // Guardamos los datos
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_role', this.role);

        // Pequeño retraso de 1.5 segundos para que veas la "pestaña blanca"
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
      } else {
        console.error('No se recibió token');
        this.router.navigate(['/login']);
      }
    });
  }
}