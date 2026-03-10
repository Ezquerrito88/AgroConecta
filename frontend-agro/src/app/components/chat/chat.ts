import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ChatService, Conversation, Message } from '../../core/services/chat';
import { AuthService } from '../../core/services/auth';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';


@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  conversations: Conversation[] = [];
  messages: Message[] = [];
  selectedConversation: Conversation | null = null;
  newMessage = '';
  currentUserId: number = 0;
  private pollSub?: Subscription;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    console.log('🔑 TOKEN:', this.authService.getToken());
    console.log('👤 USER:', this.authService.getCurrentUser());
    this.currentUserId = this.authService.getCurrentUser()?.id ?? 0;
    console.log('🆔 currentUserId:', this.currentUserId);

    this.loadConversations();
  }

  loadConversations(): void {
      console.log('📡 Cargando...');
      this.chatService.getConversations().subscribe({
        next: (data)=> {
          console.log('✅ DATA LLEGÓ A LA FUNCIÓN:', data);
          
          // Por si el backend nos la juega y manda un objeto en vez de array
          this.conversations = Array.isArray(data) ? data : (data as any).data || [];
          
          // 🔴 ESTA ES LA MAGIA: Obligamos a repintar el HTML
          this.cdr.detectChanges(); 
        },
        error: (err) => console.error('❌ ERROR:', err)
      });
    }


    selectConversation(conv: Conversation): void {
      this.selectedConversation = conv;
      this.stopPolling();
      this.loadMessages(conv.id);
      this.startPolling(conv.id);
    }

    loadMessages(convId: number): void {
      this.chatService.getMessages(convId).subscribe(data => {
        this.messages = data;
      });
    }

    startPolling(convId: number): void {
      this.pollSub = interval(5000)
        .pipe(switchMap(() => this.chatService.getMessages(convId)))
        .subscribe(data => this.messages = data);
    }

    stopPolling(): void {
      this.pollSub?.unsubscribe();
    }

    send(): void {
    if(!this.newMessage.trim() || !this.selectedConversation) return;

    // Guardamos el texto y vaciamos el input al instante para que la interfaz sea rápida
    const textToSend = this.newMessage;
    this.newMessage = ''; 

    this.chatService.sendMessage(this.selectedConversation.id, textToSend)
      .subscribe({
        next: (msg) => {
          // 🔴 MAGIA AQUÍ: En vez de hacer .push(), creamos un array NUEVO
          // copiando los mensajes viejos y añadiendo el nuevo al final
          this.messages = [...this.messages, msg];
          
          // Obligamos a repintar (el martillazo que nos funcionó antes)
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('❌ Error al enviar:', err);
          // Si falla, le devolvemos el texto al usuario para que no lo pierda
          this.newMessage = textToSend; 
        }
      });
  }

    isOwn(msg: Message): boolean {
      return msg.sender_id === this.currentUserId;
    }

    getContactName(conv: Conversation): string {
      return conv.buyer_id === this.currentUserId
        ? conv.farmer?.name ?? 'Agricultor'
        : conv.buyer?.name ?? 'Comprador';
    }


    getContactInitial(conv: Conversation): string {
      return this.getContactName(conv).charAt(0).toUpperCase();
    }

    ngOnDestroy(): void {
      this.stopPolling();
    }
  }
