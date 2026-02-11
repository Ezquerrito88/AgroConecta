import { Component, OnInit } from '@angular/core';
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
  
  // DATOS DEL FORMULARIO
  loginData = {
    email: '',
    password: ''
  };

  // Variables de estado
  showPassword: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Si vienes de Google (con token en la URL)
    this.route.queryParams.subscribe(params => {
      if (params['token']) {
        // Intentamos parsear el usuario si viene en la URL
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
  
  // LOGIN NORMAL (EMAIL Y PASSWORD)
  // Nota: Ya no necesitamos pasar 'event' porque usamos (ngSubmit) en el HTML
  onLogin() {
    this.isLoading = true;
    this.errorMessage = '';

    console.log('Intentando login con:', this.loginData);

    // IMPORTANTE: Usar 'localhost' en lugar de 127.0.0.1 para coincidir con Google
    this.http.post('http://localhost:8000/api/login', this.loginData).subscribe({
      next: (res: any) => {
        console.log('Respuesta del Servidor:', res);
        
        // Obtenemos token y usuario
        const token = res.access_token || res.token;
        const user = res.user || res.data;

        if (token) {
          this.guardarSesion(token, user);
        } else {
          this.errorMessage = 'El servidor no devolvió un token válido.';
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Error login:', err);
        this.isLoading = false;
        
        if (err.status === 401 || err.status === 422) {
          this.errorMessage = 'Email o contraseña incorrectos.';
        } else {
          this.errorMessage = 'Error de conexión. Inténtalo más tarde.';
        }
      }
    });
  }

  // LOGIN CON GOOGLE
  loginWithGoogle() {
    this.isLoading = true;
    // Ya no enviamos rol, dejamos que el backend decida o cree uno por defecto
    window.location.href = `http://localhost:8000/api/auth/google`;
  }

  // FUNCIÓN INTELIGENTE PARA GUARDAR Y REDIRIGIR 🧠
  private guardarSesion(token: string, user: any) {
    localStorage.setItem('token', token); // Recomiendo usar 'token' a secas
    
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }

    // AQUI ESTA LA MAGIA: Decidimos a dónde ir según el rol
    if (user && (user.role === 'farmer' || user.role === 'agricultor')) {
        // Si es agricultor -> Al Dashboard
        this.router.navigate(['/agricultor/dashboard']);
    } else {
        // Si es comprador o cualquier otro -> A la Home
        this.router.navigate(['/']);
    }
  }
}