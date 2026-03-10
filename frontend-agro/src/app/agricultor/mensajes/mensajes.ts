import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from '../../components/chat/chat';
import { Sidebar } from '../sidebar/sidebar';

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
export class Mensajes {}
