// configuracion.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SidebarComprador } from '../sidebar-comprador/sidebar-comprador';
import { environment } from '../../../environments/environment';

type ToastType = 'success' | 'error';
interface Toast { message: string; type: ToastType; }

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, SidebarComprador],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.css'
})
export class Configuracion implements OnInit {

  section    = 'perfil';
  loading    = false;
  formDirty  = false;
  toast: Toast | null = null;
  private toastTimer: any;

  form!: FormGroup;
  showCurrentPassword = false;
  showPassword        = false;
  showPasswordConfirm = false;

  user: any = {};
  private initialSnapshot: any = null;

  notifications = {
    pedidos:   true,
    mensajes:  true,
    ofertas:   false,
    novedades: false,
    resumen:   true,
  };

  menuItems = [
    { id: 'perfil',         icon: 'person',        title: 'Mi perfil',      subtitle: 'Nombre, email y contacto' },
    { id: 'seguridad',      icon: 'lock',          title: 'Seguridad',      subtitle: 'Contraseña y acceso' },
    { id: 'notificaciones', icon: 'notifications', title: 'Notificaciones', subtitle: 'Alertas y avisos' },
    { id: 'privacidad',     icon: 'shield',        title: 'Privacidad',     subtitle: 'Datos y cuenta', disabled: true },
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.form = this.fb.group({
      name:                  [this.user.name    || '', [Validators.required, Validators.minLength(2)]],
      email:                 [this.user.email   || '', [Validators.required, Validators.email]],
      phone:                 [this.formatPhoneValue(this.user.phone || '')],
      address:               [this.user.address || ''],
      current_password:      [''],
      password:              ['', [Validators.minLength(8)]],
      password_confirmation: [''],
    }, { validators: this.passwordsMatchValidator });

    this.initialSnapshot = this.form.value;
    this.form.valueChanges.subscribe(() => this.formDirty = true);
  }

  // ── Validador coincidencia ──
  passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const pw   = group.get('password')?.value;
    const conf = group.get('password_confirmation')?.value;
    if (pw && conf && pw !== conf) {
      group.get('password_confirmation')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    if (group.get('password_confirmation')?.errors?.['mismatch']) {
      group.get('password_confirmation')?.setErrors(null);
    }
    return null;
  }

  // ── Getters ──
  get firstName(): string   { return this.user?.name?.split(' ')[0] ?? ''; }
  get userInitial(): string { return this.firstName.charAt(0).toUpperCase(); }

  get avatarSrc(): string {
    const name = this.form?.value?.name || this.user.name || 'U';
    const initials = name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
    return `https://ui-avatars.com/api/?name=${initials}&background=FA712D&color=fff&size=72&bold=true`;
  }

  get memberSince(): string {
    const date = this.user.created_at;
    if (!date) return '—';
    return new Date(date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
  }

  get passwordStrength(): { level: number; label: string; color: string } {
    const pw = this.form?.value?.password || '';
    if (!pw) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8)           score++;
    if (/[A-Z]/.test(pw))         score++;
    if (/[0-9]/.test(pw))         score++;
    if (/[^A-Za-z0-9]/.test(pw))  score++;
    const levels = [
      { level: 1, label: 'Muy débil',  color: '#ef4444' },
      { level: 2, label: 'Débil',      color: '#f97316' },
      { level: 3, label: 'Buena',      color: '#eab308' },
      { level: 4, label: 'Muy fuerte', color: '#22c55e' },
    ];
    return levels[score - 1] ?? levels[0];
  }

  get canSavePassword(): boolean {
    return !!this.form.value.current_password
        && !!this.form.value.password
        && !this.form.get('password')?.invalid
        && !this.form.errors?.['mismatch']
        && !this.loading;
  }

  // ── Formato teléfono ──
  private formatPhoneValue(raw: string): string {
    let val = raw.replace(/\D/g, '');
    if (!val) return '';
    if (val.startsWith('34') && val.length > 9) {
      return '+34 ' + val.slice(2, 5) + ' ' + val.slice(5, 8) + ' ' + val.slice(8, 11);
    }
    if (val.length > 6) return val.slice(0, 3) + ' ' + val.slice(3, 6) + ' ' + val.slice(6, 9);
    if (val.length > 3) return val.slice(0, 3) + ' ' + val.slice(3);
    return val;
  }

  formatPhone(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = this.formatPhoneValue(input.value);
    this.form.get('phone')?.setValue(formatted, { emitEvent: false });
    input.value = formatted;
    this.formDirty = true;
  }

  // ── Acciones ──
  setSection(id: string): void { this.section = id; }

  cancelar(): void {
    this.form.patchValue(this.initialSnapshot, { emitEvent: false });
    this.formDirty = false;
  }

  guardar(): void {
    if (this.form.invalid || this.loading) return;

    const payload: any = {
      name:    this.form.value.name,
      email:   this.form.value.email,
      phone:   this.form.value.phone,
      address: this.form.value.address,
    };

    if (this.form.value.password) {
      payload.current_password      = this.form.value.current_password;
      payload.password              = this.form.value.password;
      payload.password_confirmation = this.form.value.password_confirmation;
    }

    this.loading = true;
    this.http.put<any>(`${environment.apiUrl}/user/profile`, payload).subscribe({
      next: (res) => {
        localStorage.setItem('user', JSON.stringify(res));
        this.user            = res;
        this.initialSnapshot = this.form.value;
        this.loading         = false;
        this.form.patchValue({
          current_password: '',
          password: '',
          password_confirmation: ''
        }, { emitEvent: false });
        this.formDirty = false;
        this.showToast('¡Perfil guardado correctamente!', 'success');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.showToast(err.error?.message ?? 'Error al guardar los cambios.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  dismissToast(): void {
    this.toast = null;
    clearTimeout(this.toastTimer);
  }

  private showToast(message: string, type: ToastType): void {
    clearTimeout(this.toastTimer);
    this.toast = { message, type };
    this.toastTimer = setTimeout(() => {
      this.toast = null;
      this.cdr.detectChanges();
    }, 4000);
  }
}