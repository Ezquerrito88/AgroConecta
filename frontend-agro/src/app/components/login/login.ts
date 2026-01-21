// login.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common'; 
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  // Variables que usa tu HTML
  perfilSeleccionado: string = 'comprador';
  showPassword: boolean = false;
  isLoading: boolean = false;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Esto es lo que hizo que el Dashboard funcionara
    this.route.queryParams.subscribe(params => {
      if (params['token']) {
        localStorage.setItem('auth_token', params['token']);
        localStorage.setItem('user_role', params['role']);
        this.router.navigate(['/dashboard']);
      }
    });
  }
  
  seleccionarPerfil(perfil: string) {
    this.perfilSeleccionado = perfil;
  }

  loginWithGoogle() {
    this.isLoading = true;
    // Mapeo directo: si es agricultor -> farmer, si no -> buyer
    const role = this.perfilSeleccionado === 'agricultor' ? 'farmer' : 'buyer';
    
    // Usamos la URL directamente para evitar errores de "Cannot find name"
    window.location.href = `http://127.0.0.1:8000/api/auth/google?role=${role}`;
  }

  onLogin(event: any) {
    event.preventDefault();
    // Tu lógica de login normal aquí
  }
}