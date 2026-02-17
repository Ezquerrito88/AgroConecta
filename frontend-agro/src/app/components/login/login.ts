import { Component, OnInit, isDevMode } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login implements OnInit {

  private apiUrl = 'https://agroconecta-backend-v2-bxbxfudaatbmgxdg.spaincentral-01.azurewebsites.net/api';

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
    private router: Router
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['token']) {
        let userObj = null;
        if (params['user']) {
          try {
            userObj = JSON.parse(params['user']);
          } catch (e) {
            console.error('Error leyendo usuario de Google', e);
          }
        }
        this.guardarSesion(params['token'], userObj);
      }
    });
  }

  onLogin() {
    this.isLoading = true;
    this.errorMessage = '';

    // Login directo sin CSRF - tu backend ya usa tokens
    this.http.post(`${this.apiUrl}/login`, this.loginData)
      .subscribe({
        next: (res: any) => {
          this.guardarSesion(res.access_token || res.token, res.user);
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error completo:', err); // Para ver qué pasa

          if (err.status === 401) {
            this.errorMessage = 'Credenciales incorrectas.';
          } else {
            this.errorMessage = 'Error de comunicación con el servidor.';
          }
        }
      });
  }



  loginWithGoogle() {
    this.isLoading = true;
    window.location.href = `${this.apiUrl}/auth/google`;
  }

  private guardarSesion(token: string, user: any) {
    localStorage.setItem('token', token);

    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }

    if (user && (user.role === 'farmer' || user.role === 'agricultor')) {
      this.router.navigate(['/']);
    } else {
      this.router.navigate(['/']);
    }
  }
}
