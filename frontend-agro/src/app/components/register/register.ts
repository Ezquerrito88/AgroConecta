import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register implements OnInit {

  userData = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'buyer'
  };

  showPassword = false;
  errorMessage = '';

  constructor(
    private authService: AuthService, 
    private router: Router,
    private route: ActivatedRoute 
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
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
          this.router.navigate(['/perfil']);
        }
      },
      error: (err) => {
        this.errorMessage = 'Error al registrarse. Inténtalo de nuevo.';
      }
    });
  }

  registerWithGoogle() {
    sessionStorage.setItem('google_role_intent', this.userData.role);
    window.location.href = `${environment.apiUrl}/auth/google`;
  }
}