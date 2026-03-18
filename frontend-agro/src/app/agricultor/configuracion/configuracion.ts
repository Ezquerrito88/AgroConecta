import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { FarmerService, FarmerProfile } from '../../core/services/farmer';
import { Sidebar } from '../sidebar/sidebar';

interface PerfilForm {
  name: string;
  email: string;
  phone: string;
  farm_name: string;
  city: string;
  bio: string;
  is_verified: number;
  avatar?: string;
  member_since?: string;
}

type ToastType = 'success' | 'error';

interface Toast {
  message: string;
  type: ToastType;
}

@Component({
  selector: 'app-configuracion-agricultor',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar],
  templateUrl: './configuracion.html',
  styleUrls: ['./configuracion.css']
})
export class Configuracion implements OnInit {
  section = 'perfil';
  loading = false;
  formDirty = false;
  toast: Toast | null = null;

  perfil: PerfilForm = {
    name: '',
    email: '',
    phone: '',
    farm_name: '',
    city: '',
    bio: '',
    is_verified: 0,
    avatar: '',
    member_since: ''
  };

  private initialPerfilSnapshot: PerfilForm | null = null;
  private toastTimer: any;

  constructor(
    private authService: AuthService,
    private farmerService: FarmerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarPerfil();
  }

  // Getter para el avatar con fallback de iniciales
  get avatarSrc(): string {
    if (this.perfil.avatar) return this.perfil.avatar;
    const initials = this.perfil.name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';
    return `https://ui-avatars.com/api/?name=${initials}&background=f97316&color=fff&size=72&bold=true`;
  }

  cargarPerfil(): void {
    const user = this.authService.getCurrentUser();

    if (!user || user.role !== 'farmer') {
      this.router.navigate(['/']);
      return;
    }

    this.perfil = {
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      farm_name: '',
      city: '',
      bio: '',
      is_verified: 0,
      avatar: user.avatar || '',
      member_since: user.created_at
        ? this.formatMemberSince(user.created_at)
        : ''
    };

    this.farmerService.getProfile().subscribe({
      next: (response) => {
        if (response.profile) {
          Object.assign(this.perfil, response.profile);
        }
        this.snapshotPerfil();
      },
      error: (err) => {
        console.error('Error cargando perfil:', err);
        this.snapshotPerfil();
      }
    });
  }

  onFormChange(): void {
    this.formDirty = true;
  }

  guardarPerfil(form: NgForm): void {
    if (form.invalid || !this.formDirty || this.loading) return;

    this.loading = true;

    const farmerData: FarmerProfile = {
      farm_name: this.perfil.farm_name,
      city: this.perfil.city,
      bio: this.perfil.bio,
      is_verified: this.perfil.is_verified
    };

    this.farmerService.updateProfile(farmerData).subscribe({
      next: () => {
        this.loading = false;
        this.formDirty = false;
        this.snapshotPerfil();
        this.showToast('¡Perfil guardado correctamente!', 'success');
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.message || 'Error al guardar. Inténtalo de nuevo.';
        this.showToast(msg, 'error');
      }
    });
  }

  cancelarCambios(): void {
    if (this.initialPerfilSnapshot) {
      this.perfil = { ...this.initialPerfilSnapshot };
      this.formDirty = false;
    }
  }

  isSectionActive(sectionName: string): boolean {
    return this.section === sectionName;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    const initials = this.perfil.name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';
    img.src = `https://ui-avatars.com/api/?name=${initials}&background=f97316&color=fff&size=72&bold=true`;
  }

  dismissToast(): void {
    this.toast = null;
    clearTimeout(this.toastTimer);
  }

  // ─── Privados ────────────────────────────────────────────

  private snapshotPerfil(): void {
    this.initialPerfilSnapshot = { ...this.perfil };
  }

  private showToast(message: string, type: ToastType): void {
    clearTimeout(this.toastTimer);
    this.toast = { message, type };
    this.toastTimer = setTimeout(() => (this.toast = null), 4000);
  }

  private formatMemberSince(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  }
}
