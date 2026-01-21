import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  userRole: string | null = '';

  constructor(private router: Router) {}

  ngOnInit() {
    // Recuperamos el rol que guardamos al venir de Google
    this.userRole = localStorage.getItem('user_role');

    // Seguridad básica: si no hay token, fuera al login
    if (!localStorage.getItem('auth_token')) {
      this.router.navigate(['/login']);
    }
  }

  logout() {
    localStorage.clear(); // Borra token y rol
    this.router.navigate(['/login']);
  }
}