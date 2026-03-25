import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComprador } from '../sidebar-comprador/sidebar-comprador';

@Component({
  selector: 'app-valoraciones',
  standalone: true,
  imports: [CommonModule, SidebarComprador],
  templateUrl: './valoraciones.html',
  styleUrl: './valoraciones.css'
})
export class Valoraciones {}
