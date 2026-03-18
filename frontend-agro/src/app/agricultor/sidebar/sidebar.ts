import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class Sidebar implements OnInit {
  user: any = null;
  initials = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    if (this.user?.name) {
      const parts = this.user.name.trim().split(' ');
      this.initials = (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
