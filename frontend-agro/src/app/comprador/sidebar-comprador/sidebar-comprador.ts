import { Component, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-sidebar-comprador',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar-comprador.html',
  styleUrls: ['./sidebar-comprador.css']
})
export class SidebarComprador implements OnInit {
  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<boolean>();

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

  close() {
    this.isOpenChange.emit(false);
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isOpen) this.close();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
