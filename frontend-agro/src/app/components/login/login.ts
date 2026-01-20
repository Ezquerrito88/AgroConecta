import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  perfilSeleccionado: string = 'comprador';
  showPassword: boolean = false;
  isLoading: boolean = false; // <-- Nueva variable para el estado de carga

  constructor(private http: HttpClient) {}
  
  seleccionarPerfil(perfil: string) {
    this.perfilSeleccionado = perfil;
  }

  onLogin(event: any) {
    event.preventDefault();
    if (this.isLoading) return; // Evita que se envíe varias veces si ya está cargando

    this.isLoading = true; // Activamos el spinner

    const body = {
      email: event.target.email.value,
      password: event.target.password.value,
      perfil: this.perfilSeleccionado
    };

    // Simulamos o enviamos la petición
    this.http.post('/api/login', body).subscribe({
      next: (res) => {
        console.log('¡Login correcto!', res);
        this.isLoading = false; // Desactivamos el spinner
      },
      error: (err) => {
        console.error('Error en el login', err);
        this.isLoading = false; // Desactivamos el spinner incluso si hay error
        alert('Error al iniciar sesión. Revisa tus datos.');
      }
    });
  }
}