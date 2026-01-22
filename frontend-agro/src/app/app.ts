import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App implements OnInit {
  isLoggedIn: boolean = false; 
  mostrarLayout: boolean = true;

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // 1. Control de visibilidad del Layout
      this.mostrarLayout = !event.urlAfterRedirects.includes('/login');

      // 2. Control de sesión: Si hay token, estamos logueados
      // Verificamos 'auth_token' que es lo que guardas en tu login.ts
      const token = localStorage.getItem('auth_token');
      this.isLoggedIn = !!token; 
    });
  }
}