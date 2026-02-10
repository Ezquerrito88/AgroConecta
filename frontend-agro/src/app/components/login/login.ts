import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink], // <--- AÑÁDELO AQUÍ TAMBIÉN
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  
  // DATOS DEL FORMULARIO
  loginData = {
    email: '',
    password: ''
  };

  perfilSeleccionado: string = 'comprador';
  showPassword: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = ''; // Para mostrar errores en pantalla si falla

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Si vienes de Google (con token en la URL)
    this.route.queryParams.subscribe(params => {
      if (params['token']) {
        this.guardarSesion(params['token'], null); // Guardamos token y redirigimos
      }
    });
  }
  
  seleccionarPerfil(perfil: string) {
    this.perfilSeleccionado = perfil;
  }

  // LOGIN NORMAL (EMAIL Y PASSWORD)
  onLogin(event: Event) {
    event.preventDefault(); // Evita que la página se recargue sola
    this.isLoading = true;
    this.errorMessage = '';

    console.log('Intentando login con:', this.loginData);

    // LLAMADA AL BACKEND (Laravel)
    // Asegúrate de que la ruta es correcta. Normalmente es /api/login
    this.http.post('http://127.0.0.1:8000/api/login', this.loginData).subscribe({
      next: (res: any) => {
        console.log('Respuesta del Servidor:', res);
        
        // 1. Obtener el token (a veces viene como access_token o token)
        const token = res.access_token || res.token;
        
        // 2. Obtener el usuario
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
        
        if (err.status === 401) {
          this.errorMessage = 'Email o contraseña incorrectos.';
        } else {
          this.errorMessage = 'Error de conexión con el servidor.';
        }
      }
    });
  }

  // LOGIN CON GOOGLE
  loginWithGoogle() {
    this.isLoading = true;
    const role = this.perfilSeleccionado === 'agricultor' ? 'farmer' : 'buyer';
    window.location.href = `http://127.0.0.1:8000/api/auth/google?role=${role}`;
  }

  // FUNCIÓN AUXILIAR PARA GUARDAR Y REDIRIGIR
  private guardarSesion(token: string, user: any) {
    localStorage.setItem('auth_token', token);
    
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }

    // Redirigir al dashboard
    this.router.navigate(['/dashboard']).then(() => {
      // Recargar para que app.component.ts lea el nuevo usuario y ponga el Tractor
      window.location.reload(); 
    });
  }
}