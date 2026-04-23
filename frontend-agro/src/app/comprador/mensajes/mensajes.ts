import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from '../../components/chat/chat';
import { SidebarComprador } from '../sidebar-comprador/sidebar-comprador';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-buyer-mensajes',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComprador,
    ChatComponent,
    FormsModule,
    RouterModule // Añadido para que el routerLink funcione
  ],
  templateUrl: './mensajes.html',
  styleUrls: ['./mensajes.css']
})
export class Mensajes implements OnInit {
  sidebarOpen = false;
  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }

  user: any = {};
  
  // Variables para filtros y búsqueda
  searchQuery: string = '';
  sortBy: string = 'recent';
  
  // Opciones del select que faltaban
  sortOptions = [
    { value: 'recent', label: 'Más recientes' },
    { value: 'unread', label: 'No leídos' },
    { value: 'oldest', label: 'Más antiguos' }
  ];

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
  }

  /**
   * Método para aplicar filtros (puedes dejarlo vacío por ahora
   * o usarlo para emitir eventos al componente app-chat)
   */
  applyFilters(): void {
    console.log('Filtrando por:', this.searchQuery, 'Orden:', this.sortBy);
    // Aquí podrías llamar a un método del ChatComponent usando @ViewChild si fuera necesario
  }

  get firstName(): string { 
    return this.user?.name?.split(' ')[0] ?? 'Usuario'; 
  }

  get userInitial(): string { 
    return this.firstName.charAt(0).toUpperCase() || '?'; 
  }
}