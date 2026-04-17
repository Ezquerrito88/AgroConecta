import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login implements OnInit {
  private readonly PENDING_CHECKOUT_KEY = 'pending_checkout';
  private apiUrl = environment.apiUrl;

  loginData = {
    email: '',
    password: ''
  };

  showPassword: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    // Escuchamos los parámetros que vienen de Laravel tras el éxito de Google
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const encodedData = params['data']; // Laravel envía 'data' en base64

      if (token) {
        let userObj = null;
        if (encodedData) {
          try {
            // Decodificamos el Base64 que viene de la API
            userObj = JSON.parse(atob(encodedData));
          } catch (e) {
            console.error('Error decodificando usuario de Google', e);
          }
        }
        this.guardarSesion(token, userObj);
      }
    });
  }

  onLogin() {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.post(`${this.apiUrl}/login`, this.loginData)
      .subscribe({
        next: (res: any) => {
          // Usamos access_token para ser consistentes con Laravel Sanctum
          this.guardarSesion(res.access_token || res.token, res.user);
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          if (err.status === 401) {
            this.errorMessage = 'Credenciales incorrectas.';
          } else {
            this.errorMessage = 'Error de comunicación con el servidor.';
          }
          this.cdr.detectChanges();
        }
      });
  }

  loginWithGoogle() {
    this.isLoading = true;
    // Recuperamos el rol si estuviera en la URL actual, si no, 'buyer' por defecto
    const role = this.route.snapshot.queryParamMap.get('role') || 'buyer';
    window.location.href = `${this.apiUrl}/auth/google?role=${role}`;
  }

  private guardarSesion(token: string, user: any) {
    localStorage.setItem('token', token);

    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }

    // Lógica de redirección inteligente
    const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');
    const hasPendingCheckout = sessionStorage.getItem(this.PENDING_CHECKOUT_KEY) === '1';

    if (hasPendingCheckout) {
      this.router.navigate(['/checkout']);
      return;
    }

    if (redirectTo) {
      this.router.navigateByUrl(redirectTo);
      return;
    }

    // Redirección por rol si no hay rutas pendientes
    if (user?.role === 'farmer') {
      this.router.navigate(['/farmer/dashboard']);
    } else {
      this.router.navigate(['/']);
    }
  }
}