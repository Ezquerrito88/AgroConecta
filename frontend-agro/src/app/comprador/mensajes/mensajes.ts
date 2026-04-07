import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from '../../components/chat/chat';
import { SidebarComprador } from '../sidebar-comprador/sidebar-comprador';

@Component({
  selector: 'app-buyer-mensajes',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComprador,
    ChatComponent,
  ],
  templateUrl: './mensajes.html',
  styleUrls: ['./mensajes.css']
})
export class Mensajes {}