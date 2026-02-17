import { Component, OnInit } from '@angular/core'; // <--- Añade OnInit
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register implements OnInit { // <--- Añade implements OnInit

  userData = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'buyer' // Por defecto
  };

  showPassword = false;
  errorMessage = '';

  // Inyectamos ActivatedRoute para leer la URL
  constructor(
    private authService: AuthService, 
    private router: Router,
    private route: ActivatedRoute 
  ) {}

  // 👇 ESTA ES LA FUNCIÓN MÁGICA
  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      // Si en la URL viene ?role=farmer, cambiamos el rol
      if (params['role']) {
        this.userData.role = params['role'];
      }
    });
  }

  onRegister() {
    // ... tu código de registro ...
    this.authService.register(this.userData).subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        
        if (res.user.role === 'farmer') {
          this.router.navigate(['/agricultor/dashboard']);
        } else {
          this.router.navigate(['/perfil']); // O a la home
        }
      },
      error: (err) => {
        this.errorMessage = 'Error al registrarse. Inténtalo de nuevo.';
      }
    });
  }

  registerWithGoogle() {
    sessionStorage.setItem('google_role_intent', this.userData.role);
    window.location.href = 'https://agroconecta-backend-v2-bxbxfudaatbmgxdg.spaincentral-01.azurewebsites.net/api/auth/google';
  }
}