import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register implements OnInit {
  private readonly PENDING_CHECKOUT_KEY = 'pending_checkout';
  private apiUrl = environment.apiUrl;

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
    this.authService.register(this.userData).subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));

        const hasPendingCheckout = sessionStorage.getItem(this.PENDING_CHECKOUT_KEY) === '1';
        if (hasPendingCheckout) {
          this.router.navigate(['/checkout']);
          return;
        }

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
    // Lee el rol directamente de la URL (?role=farmer o ?role=buyer)
    const role = this.route.snapshot.queryParamMap.get('role') || 'buyer';
    window.location.href = `${this.apiUrl}/auth/google?role=${role}`;
  }
}