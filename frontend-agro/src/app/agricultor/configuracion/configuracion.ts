import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { FarmerService, FarmerProfile } from '../../core/services/farmer';
import { Sidebar } from '../sidebar/sidebar';
import { PhoneFormatPipe } from '../../core/pipes/phone-format-pipe';
import { environment } from '../../../environments/environment';

interface PerfilForm {
  name: string;
  email: string;
  phone: string;
  farm_name: string;
  city: string;
  bio: string;
  avatar?: string;
  member_since?: string;
}

type ToastType = 'success' | 'error';
interface Toast { message: string; type: ToastType; }

@Component({
  selector: 'app-configuracion-agricultor',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, PhoneFormatPipe],
  templateUrl: './configuracion.html',
  styleUrls: ['./configuracion.css']
})
export class Configuracion implements OnInit {
  section = 'perfil';
  loading = false;
  toast: Toast | null = null;
  user: any = null;

  private apiUrl = environment.apiUrl;

  perfil: PerfilForm = {
    name: '',
    email: '',
    phone: '',
    farm_name: '',
    city: '',
    bio: '',
    avatar: '',
    member_since: ''
  };

  passwordForm = {
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  };
  passwordLoading = false;
  passwordError = '';

  private initialPerfilSnapshot: PerfilForm | null = null;
  private toastTimer: any;

  constructor(
    private authService: AuthService,
    private farmerService: FarmerService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.cargarPerfil();
  }

  get avatarSrc(): string {
    if (this.perfil.avatar) return this.perfil.avatar;
    const initials = this.perfil.name
      .split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U';
    return `https://ui-avatars.com/api/?name=${initials}&background=f97316&color=fff&size=72&bold=true`;
  }

  cargarPerfil(): void {
    const user = this.authService.getCurrentUser();
    if (!user || user.role !== 'farmer') {
      this.router.navigate(['/']);
      return;
    }

    this.perfil = {
      name:         user.name       || '',
      email:        user.email      || '',
      phone:        this.applyPhoneFormat(user.phone || ''),
      farm_name:    '',
      city:         '',
      bio:          '',
      avatar:       user.avatar     || '',
      member_since: user.created_at ? this.formatMemberSince(user.created_at) : ''
    };

    this.farmerService.getProfile().subscribe({
      next: (response) => {
        if (response.profile) {
          this.perfil.farm_name = response.profile.farm_name || '';
          this.perfil.city      = response.profile.city      || '';
          this.perfil.bio       = response.profile.bio       || '';
          if (response.profile.phone) {
            this.perfil.phone = this.applyPhoneFormat(response.profile.phone);
          }
        }
        this.snapshotPerfil();
      },
      error: (err) => {
        console.error('Error cargando perfil:', err);
        this.snapshotPerfil();
      }
    });
  }

  guardarPerfil(form: NgForm): void {
    if (form.invalid || !form.dirty || this.loading) return;
    this.loading = true;

    const farmerData: FarmerProfile = {
      farm_name: this.perfil.farm_name,
      city:      this.perfil.city,
      bio:       this.perfil.bio,
      phone:     this.perfil.phone,
    };

    this.farmerService.updateProfile(farmerData).subscribe({
      next: () => {
        this.loading = false;
        form.resetForm(this.perfil);
        this.snapshotPerfil();
        this.showToast('¡Perfil guardado correctamente!', 'success');
      },
      error: (err) => {
        this.loading = false;
        this.showToast(err.error?.message || 'Error al guardar. Inténtalo de nuevo.', 'error');
      }
    });
  }

  cancelarCambios(form: NgForm): void {
    if (this.initialPerfilSnapshot) {
      this.perfil = { ...this.initialPerfilSnapshot };
      form.resetForm(this.perfil);
    }
  }

  cambiarPassword(): void {
    this.passwordError = '';

    if (!this.passwordForm.current_password ||
        !this.passwordForm.new_password ||
        !this.passwordForm.new_password_confirmation) {
      this.passwordError = 'Rellena todos los campos.';
      return;
    }

    if (this.passwordForm.new_password.length < 8) {
      this.passwordError = 'La nueva contraseña debe tener al menos 8 caracteres.';
      return;
    }

    if (this.passwordForm.new_password !== this.passwordForm.new_password_confirmation) {
      this.passwordError = 'Las contraseñas no coinciden.';
      return;
    }

    this.passwordLoading = true;

    this.http.put(`${this.apiUrl}/user/password`, this.passwordForm).subscribe({
      next: () => {
        this.passwordLoading = false;
        this.resetPasswordForm();
        this.showToast('Contraseña actualizada correctamente.', 'success');
      },
      error: (err) => {
        this.passwordLoading = false;
        this.passwordError = err.error?.message || 'Error al cambiar la contraseña.';
      }
    });
  }

  resetPasswordForm(): void {
    this.passwordForm = {
      current_password: '',
      new_password: '',
      new_password_confirmation: ''
    };
    this.passwordError = '';
  }

  formatPhone(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.perfil.phone = this.applyPhoneFormat(input.value);
    input.value = this.perfil.phone;
  }

  isSectionActive(s: string): boolean { return this.section === s; }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const initials = this.perfil.name
      .split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U';
    img.src = `https://ui-avatars.com/api/?name=${initials}&background=f97316&color=fff&size=72&bold=true`;
  }

  dismissToast(): void {
    this.toast = null;
    clearTimeout(this.toastTimer);
  }

  private applyPhoneFormat(phone: string): string {
    let value = phone.replace(/[^\d+]/g, '');

    if (value.startsWith('+34')) {
      const digits = value.slice(3);
      if (digits.length <= 3)      return `+34 ${digits}`;
      else if (digits.length <= 6) return `+34 ${digits.slice(0,3)} ${digits.slice(3)}`;
      else                         return `+34 ${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6,9)}`;
    } else {
      if (value.length <= 3)      return value;
      else if (value.length <= 6) return `${value.slice(0,3)} ${value.slice(3)}`;
      else                        return `${value.slice(0,3)} ${value.slice(3,6)} ${value.slice(6,9)}`;
    }
  }

  private snapshotPerfil(): void {
    this.initialPerfilSnapshot = { ...this.perfil };
  }

  private showToast(message: string, type: ToastType): void {
    clearTimeout(this.toastTimer);
    this.toast = { message, type };
    this.toastTimer = setTimeout(() => (this.toast = null), 4000);
  }

  private formatMemberSince(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  }
}