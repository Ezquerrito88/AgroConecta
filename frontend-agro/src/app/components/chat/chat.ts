import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, Conversation, Message } from '../../core/services/chat';
import { AuthService } from '../../core/services/auth';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  conversations: Conversation[] = [];
  messages: Message[] = [];
  selectedConversation: Conversation | null = null;
  newMessage = '';
  currentUserId = 0;
  loading = false;
  sendingMessage = false;

  private pollSub?: Subscription;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUser()?.id ?? 0;
    this.loadConversations();
  }

  loadConversations(): void {
    this.loading = true;
    this.chatService.getConversations().subscribe({
      next: (data) => {
        this.conversations = Array.isArray(data) ? data : (data as any).data ?? [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando conversaciones:', err);
        this.loading = false;
      }
    });
  }

  selectConversation(conv: Conversation): void {
    this.selectedConversation = conv;
    this.stopPolling();
    this.loadMessages(conv.id);
    this.startPolling(conv.id);
  }

  loadMessages(convId: number): void {
    this.chatService.getMessages(convId).subscribe({
      next: (data) => {
        this.messages = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando mensajes:', err)
    });
  }

  startPolling(convId: number): void {
    this.pollSub = interval(5000)
      .pipe(switchMap(() => this.chatService.getMessages(convId)))
      .subscribe({
        next: (data) => {
          this.messages = data;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error en polling:', err)
      });
  }

  stopPolling(): void {
    this.pollSub?.unsubscribe();
  }

  send(): void {
    if (!this.newMessage.trim() || !this.selectedConversation || this.sendingMessage) return;

    const textToSend = this.newMessage;
    this.newMessage = '';
    this.sendingMessage = true;

    this.chatService.sendMessage(this.selectedConversation.id, textToSend).subscribe({
      next: (msg) => {
        this.messages = [...this.messages, msg];
        this.sendingMessage = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al enviar mensaje:', err);
        this.newMessage = textToSend;
        this.sendingMessage = false;
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
