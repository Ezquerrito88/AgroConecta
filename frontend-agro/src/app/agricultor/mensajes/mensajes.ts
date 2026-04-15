import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from '../../components/chat/chat';
import { Sidebar } from '../sidebar/sidebar';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-mensajes',
  standalone: true,
  imports: [
    CommonModule,
    Sidebar,
    ChatComponent,
  ],
  templateUrl: './mensajes.html',
  styleUrls: ['./mensajes.css']
})
export class Mensajes implements OnInit {

  user: any = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
  }
}